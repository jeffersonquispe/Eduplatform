import { createClient } from "@/lib/supabase/server";

// Los modelos de 384 dimensiones suelen truncar en ~512 tokens (~2000 caracteres en espanol).
// El texto va de lo mas a lo menos importante para que el recorte afecte solo al final.
const MAX_CHARS = 2000;
const MAX_BODY_CHARS = 300;

export type CourseEmbeddingSource = {
  title: string;
  description: string;
  category: { name: string } | null;
  sections: {
    title: string;
    position: number;
    lessons: {
      title: string;
      position: number;
      content: { body: string } | null;
    }[];
  }[];
};

const COURSE_SELECT =
  "title, description, category:categories(name), sections(title, position, lessons(title, position, content:lesson_contents(body)))";

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

// Titulo, descripcion, temario (secciones y titulos de leccion) y, al final, el cuerpo de cada leccion.
export function buildCourseEmbeddingText(course: CourseEmbeddingSource) {
  const sections = [...course.sections].sort((a, b) => a.position - b.position);
  const lessonsOf = (s: CourseEmbeddingSource["sections"][number]) =>
    [...s.lessons].sort((a, b) => a.position - b.position);

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

// Lee el curso con la sesion del usuario. El cuerpo de las lecciones solo lo ve el propietario
// o un inscrito (RLS): para un autenticado sin acceso, el texto sale solo con titulo, descripcion
// y temario. Sin sesion, `lesson_contents` no tiene grant para anon y la consulta falla (devuelve null).
// Para que el embedding incluya el contenido, llamarla como propietario del curso.
export async function getCourseEmbeddingText(courseId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select(COURSE_SELECT).eq("id", courseId).maybeSingle();
  if (!data) return null;
  return buildCourseEmbeddingText(data as unknown as CourseEmbeddingSource);
}
