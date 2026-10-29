import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { getCategories, getPublishedCourses } from "@/lib/courses";

export default async function Home() {
  const [categories, courses] = await Promise.all([getCategories(), getPublishedCourses()]);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <section className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Aprende marketing digital e inteligencia artificial</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Cursos practicos de instructores expertos: desde SEO y publicidad hasta automatizacion con IA.
        </p>
        <Link
          href="/cursos"
          className="mt-5 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Explorar cursos
        </Link>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Categorias</h2>
        <ul className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/cursos?categoria=${c.slug}`}
                className="rounded-full border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Ultimos cursos</h2>
        {courses.length === 0 ? (
          <p className="text-sm text-zinc-500">Todavia no hay cursos publicados.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 6).map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
