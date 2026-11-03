import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { buttonClass } from "@/components/ui";
import { getCategories, getPublishedCourses } from "@/lib/courses";

// Pagina dependiente de la sesion y de la base de datos: la navegacion puede esperar al servidor.
export const instant = false;

export const metadata = { title: "Cursos" };

export default async function CatalogPage({ searchParams }: PageProps<"/cursos">) {
  const params = await searchParams;
  const categoria = typeof params.categoria === "string" ? params.categoria : undefined;
  const q = typeof params.q === "string" ? params.q : undefined;

  const [categories, courses] = await Promise.all([
    getCategories(),
    getPublishedCourses({ category: categoria, q }),
  ]);

  const pill = (active: boolean) => `eb-pill${active ? " eb-pill--active" : ""}`;
  const withQ = (slug?: string) => {
    const sp = new URLSearchParams();
    if (slug) sp.set("categoria", slug);
    if (q) sp.set("q", q);
    const s = sp.toString();
    return s ? `/cursos?${s}` : "/cursos";
  };

  return (
    <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold">Cursos</h1>

      <form action="/cursos" role="search" className="mt-4 flex gap-2">
        {categoria ? <input type="hidden" name="categoria" value={categoria} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar cursos"
          aria-label="Buscar cursos"
          className="eb-input max-w-md"
        />
        <button type="submit" className="eb-btn eb-btn--primary">
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

      {categoria || q ? (
        <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Filtros activos">
          <span className="text-xs text-fg-3">Filtros:</span>
          {q ? (
            <Link href={categoria ? `/cursos?categoria=${categoria}` : "/cursos"} className="eb-chip">
              Búsqueda: {q} <span aria-hidden>×</span>
              <span className="sr-only">Quitar búsqueda</span>
            </Link>
          ) : null}
          {categoria ? (
            <Link href={q ? `/cursos?q=${encodeURIComponent(q)}` : "/cursos"} className="eb-chip">
              {categories.find((c) => c.slug === categoria)?.name ?? categoria} <span aria-hidden>×</span>
              <span className="sr-only">Quitar categoría</span>
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6">
        {courses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-strong p-8 text-center">
            <p className="text-sm text-fg-3">No encontramos cursos con esos criterios.</p>
            <p className="mt-1 text-sm text-fg-2">Prueba con otras palabras o explora todo el catálogo.</p>
            <Link href="/cursos" className={`${buttonClass("primary", { sm: true })} mt-4`}>
              Quitar filtros
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-fg-3" role="status" aria-live="polite">
              {courses.length} {courses.length === 1 ? "curso" : "cursos"}
            </p>
            <ul className="eb-grid">
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
