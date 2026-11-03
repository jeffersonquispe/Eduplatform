import type { NextRequest } from "next/server";
import { getPublishedCourses } from "@/lib/courses";

const MAX_QUERY_CHARS = 200;
const MAX_RESULTS = 10;

// Ventanilla publica para Edy (el microservicio): busca cursos por similitud semantica y devuelve
// solo datos publicos. Pasa por `getPublishedCourses`, es decir, el mismo acceso que el catalogo
// (clave anon + sesion del usuario, que aqui es ninguna): RLS sigue protegiendo los cursos sin
// publicar y la Edge Function `search-courses` solo devuelve cursos publicados.
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").replace(/\s+/g, " ").trim();
  if (!q) return Response.json({ error: "Falta el parametro q" }, { status: 400 });
  if (q.length > MAX_QUERY_CHARS) {
    return Response.json({ error: `La busqueda supera ${MAX_QUERY_CHARS} caracteres` }, { status: 400 });
  }

  const courses = await getPublishedCourses({ q });

  // Lista blanca explicita: rating, categoria e instructor existen en el resumen pero no se exponen.
  return Response.json({
    courses: courses.slice(0, MAX_RESULTS).map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      url: new URL(`/cursos/${c.id}`, request.nextUrl.origin).toString(),
    })),
  });
}
