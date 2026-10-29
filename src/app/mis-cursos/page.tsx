import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getMyEnrollments } from "@/lib/learning";

export const metadata = { title: "Mis cursos" };

export default async function MyCoursesPage() {
  const user = await requireRole("student", "/mis-cursos");
  const enrollments = await getMyEnrollments(user.id);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold">Mis cursos</h1>

      {enrollments.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500">Aun no estas inscrito en ningun curso.</p>
          <Link href="/cursos" className="mt-3 inline-block text-sm underline">
            Explorar el catalogo
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map(({ course }) => (
            <li key={course!.id} className="flex flex-col rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="font-semibold">{course!.title}</h2>
              {course!.instructor ? (
                <p className="text-xs text-zinc-500">Por {course!.instructor.display_name}</p>
              ) : null}
              {course!.status !== "published" ? (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Ya no esta en el catalogo</p>
              ) : null}
              <Link
                href={`/aprender/${course!.id}`}
                className="mt-auto pt-4 text-sm font-medium underline"
              >
                Continuar aprendiendo
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
