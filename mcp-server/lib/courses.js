import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

// Mismas columnas publicas que usa el catalogo de la app (ver src/lib/courses.ts,
// SUMMARY_SELECT) y los nombres reales de supabase/migrations/20261023000003_courses.sql
// y 20261023000002_categories.sql. Nunca selecciona columnas que RLS no deja leer a `anon`.
const PUBLISHED_COURSES_SELECT =
  "id, title, description, rating_avg, rating_count, created_at, category:categories(slug, name), instructor:profiles!instructor_id(id, display_name)";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (revisa .env.local en la raiz del proyecto).",
    );
  }
  // Nunca abrimos un canal de realtime (solo hacemos select), pero el constructor del SDK
  // crea un RealtimeClient igual y en Node < 22 falla sin WebSocket nativo; le damos "ws".
  return createClient(url, anonKey, {
    auth: { persistSession: false },
    realtime: { transport: WebSocket },
  });
}

export async function listPublishedCourses({ category, limit } = {}) {
  const supabase = getClient();

  let query = supabase
    .from("courses")
    .select(PUBLISHED_COURSES_SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (category) {
    const { data: cat, error: catError } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .maybeSingle();
    if (catError) throw new Error(catError.message);
    if (!cat) return [];
    query = query.eq("category_id", cat.id);
  }

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}
