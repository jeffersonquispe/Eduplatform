// Edge Function `embed-course`: calcula el embedding de un curso con gte-small (384 dimensiones,
// el modelo integrado del runtime de Supabase) y lo guarda en `courses.embedding`.
//
// La invoca el trigger `courses_notify_embedding` (migracion 20261023000014) con
//   POST { "course_id": "<uuid>" }  +  cabecera  x-webhook-secret
//
// Corre en el servidor y usa el service role (SUPABASE_SERVICE_ROLE_KEY, que Supabase inyecta solo)
// por dos motivos: `embedding` no tiene grant de escritura para `authenticated`, y el cuerpo de las
// lecciones (`lesson_contents`) solo es visible para inscritos y propietario. Por eso esta funcion
// NO debe aceptar peticiones sin el secreto compartido.
//
// Puesta en marcha (una vez):
//   npx supabase secrets set EMBED_COURSE_SECRET=<valor aleatorio largo>
//   npx supabase functions deploy embed-course
//   y en el SQL editor:  select vault.create_secret('https://<ref>.supabase.co', 'project_url');
//                        select vault.create_secret('<mismo valor>', 'embed_course_secret');

import { createClient } from "npm:@supabase/supabase-js@2";

// Global del runtime de Edge Functions (no existe en los tipos de Deno).
declare const Supabase: { ai: { Session: new (model: string) => { run(input: string, opts: object): Promise<number[]> } } };

const session = new Supabase.ai.Session("gte-small");

// --- Texto del curso ---------------------------------------------------------------------------
// Copia de `buildCourseEmbeddingText` en src/lib/embeddings.ts (esta funcion no puede importar el
// codigo de Next). Si cambias uno, cambia el otro.
const MAX_CHARS = 2000;
const MAX_BODY_CHARS = 300;

type Lesson = { title: string; position: number; content: { body: string } | null };
type Section = { title: string; position: number; lessons: Lesson[] };
type Course = {
  title: string;
  description: string;
  category: { name: string } | null;
  sections: Section[];
};

const COURSE_SELECT =
  "title, description, category:categories(name), sections(title, position, lessons(title, position, content:lesson_contents(body)))";

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

function buildCourseEmbeddingText(course: Course) {
  const sections = [...course.sections].sort((a, b) => a.position - b.position);
  const lessonsOf = (s: Section) => [...s.lessons].sort((a, b) => a.position - b.position);

  const parts = [course.title.trim(), collapse(course.description)];
  if (course.category) parts.push(`Categoria: ${course.category.name}`);

  const outline = sections.map((s) => `${s.title}: ${lessonsOf(s).map((l) => l.title).join("; ")}`);
  if (outline.length) parts.push(`Temario: ${outline.join(". ")}`);

  const bodies = sections
    .flatMap(lessonsOf)
    .map((l) => collapse(l.content?.body ?? "").slice(0, MAX_BODY_CHARS))
    .filter(Boolean);
  if (bodies.length) parts.push(`Contenido: ${bodies.join(" ")}`);

  return parts.filter(Boolean).join("\n\n").slice(0, MAX_CHARS);
}

// --- Handler -----------------------------------------------------------------------------------
const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Metodo no permitido" }, 405);

  // El gateway no verifica JWT en esta funcion (verify_jwt = false en config.toml): la unica
  // barrera es el secreto compartido con el trigger.
  const expected = Deno.env.get("EMBED_COURSE_SECRET");
  if (!expected || req.headers.get("x-webhook-secret") !== expected) {
    return json({ error: "No autorizado" }, 401);
  }

  const { course_id: courseId } = await req.json().catch(() => ({}));
  if (typeof courseId !== "string") return json({ error: "Falta course_id" }, 400);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data, error } = await supabase.from("courses").select(COURSE_SELECT).eq("id", courseId).maybeSingle();
  if (error) return json({ error: error.message }, 500);
  if (!data) return json({ error: "Curso no encontrado" }, 404);

  const text = buildCourseEmbeddingText(data as unknown as Course);
  const embedding = await session.run(text, { mean_pool: true, normalize: true });

  // pgvector acepta el vector como texto '[0.1,0.2,...]'.
  const { error: updateError } = await supabase
    .from("courses")
    .update({ embedding: JSON.stringify(embedding) })
    .eq("id", courseId);
  if (updateError) return json({ error: updateError.message }, 500);

  return json({ ok: true, course_id: courseId, chars: text.length });
});
