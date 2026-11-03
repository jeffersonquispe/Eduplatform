// Edge Function `search-courses`: busqueda semantica en el catalogo.
//
//   POST { "query": "quiero aprender a vender por redes", "limit": 10 }
//   -> { "courses": [ { id, title, description, rating_avg, rating_count,
//                       category_slug, category_name, instructor_id, instructor_display_name,
//                       similarity }, ... ] }
//
// Convierte la frase en un embedding con gte-small (el mismo modelo que `embed-course`, si no los
// vectores no serian comparables) y llama a `match_courses`, que devuelve solo cursos publicados
// y solo datos publicos. Usa la clave anon, no el service role: no necesita saltarse RLS.
//
// Solo devuelve los cursos con `similarity` >= MIN_SIMILARITY (0.8); si ninguno llega, `courses` es [].
//
// verify_jwt = false (config.toml) porque el catalogo es publico. Cada llamada gasta computo del
// modelo: por eso se limita el largo de la frase. No hay limite de peticiones por usuario.

import { createClient } from "npm:@supabase/supabase-js@2";

// Global del runtime de Edge Functions (no existe en los tipos de Deno).
declare const Supabase: { ai: { Session: new (model: string) => { run(input: string, opts: object): Promise<number[]> } } };

const session = new Supabase.ai.Session("gte-small");

const MAX_QUERY_CHARS = 200;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

// Un curso solo aparece si su similitud con la frase llega a este valor. Con gte-small los puntajes
// se agrupan entre 0.75 y 0.87, asi que el umbral descarta lo mas lejano pero no es una garantia de
// relevancia: hay cursos sin relacion por encima y cursos relevantes justo por debajo.
const MIN_SIMILARITY = 0.8;

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Metodo no permitido" }, 405);

  const { query, limit } = await req.json().catch(() => ({}));
  const text = typeof query === "string" ? query.replace(/\s+/g, " ").trim() : "";
  if (!text) return json({ error: "Falta query" }, 400);
  if (text.length > MAX_QUERY_CHARS) return json({ error: `La busqueda supera ${MAX_QUERY_CHARS} caracteres` }, 400);

  const count = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), MAX_LIMIT) : DEFAULT_LIMIT;

  const embedding = await session.run(text, { mean_pool: true, normalize: true });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data, error } = await supabase.rpc("match_courses", {
    query_embedding: JSON.stringify(embedding),
    match_count: count,
  });
  if (error) return json({ error: error.message }, 500);

  // Los resultados ya vienen ordenados por similitud: se descartan los que quedan por debajo del umbral.
  const courses = (data ?? []).filter((c: { similarity: number }) => c.similarity >= MIN_SIMILARITY);
  return json({ courses });
});
