import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Panel del instructor" };

export default async function InstructorPage() {
  const user = await requireRole("instructor", "/instructor");
  const supabase = await createClient();

  // Solo los cursos propios, con su numero de inscritos (RLS deja contar solo las de sus cursos).
  const { data } = await supabase
    .from("courses")
    .select("id, title, status, updated_at, enrollments(count)")
    .eq("instructor_id", user.id)
    .order("updated_at", { ascending: false });
  const courses = data ?? [];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Panel del instructor</h1>
        <Link
          href="/instructor/cursos/nuevo"
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Nuevo curso
        </Link>
      </div>

      {courses.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Aun no has creado cursos. Crea el primero para empezar.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {courses.map((c) => {
            const enrolled = c.enrollments?.[0]?.count ?? 0;
            return (
              <li key={c.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <Link href={`/instructor/cursos/${c.id}`} className="font-medium hover:underline">
                    {c.title}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    {enrolled} {enrolled === 1 ? "inscrito" : "inscritos"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    c.status === "published"
                      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {c.status === "published" ? "Publicado" : "Borrador"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
