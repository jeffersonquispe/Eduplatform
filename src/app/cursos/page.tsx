import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { getCategories, getPublishedCourses } from "@/lib/courses";

export const metadata = { title: "Cursos" };

export default async function CatalogPage({ searchParams }: PageProps<"/cursos">) {
  const params = await searchParams;
  const categoria = typeof params.categoria === "string" ? params.categoria : undefined;
  const q = typeof params.q === "string" ? params.q : undefined;

  const [categories, courses] = await Promise.all([
    getCategories(),
    getPublishedCourses({ category: categoria, q }),
  ]);

  const pill = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm ${
      active
        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
        : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    }`;
  const withQ = (slug?: string) => {
    const sp = new URLSearchParams();
    if (slug) sp.set("categoria", slug);
    if (q) sp.set("q", q);
    const s = sp.toString();
    return s ? `/cursos?${s}` : "/cursos";
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold">Cursos</h1>

      <form action="/cursos" role="search" className="mt-4 flex gap-2">
        {categoria ? <input type="hidden" name="categoria" value={categoria} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar cursos"
          aria-label="Buscar cursos"
          className="w-full max-w-md rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
          Buscar
        </button>
      </form>

      <nav aria-label="Categorias" className="mt-4 flex flex-wrap gap-2">
        <Link href={withQ()} className={pill(!categoria)}>
          Todas
        </Link>
        {categories.map((c) => (
          <Link key={c.slug} href={withQ(c.slug)} className={pill(categoria === c.slug)}>
            {c.name}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {courses.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No encontramos cursos con esos criterios.
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm text-zinc-500">
              {courses.length} {courses.length === 1 ? "curso" : "cursos"}
            </p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
