import Link from "next/link";
import { FeaturedCourses } from "@/components/featured-courses";
import TallerAgente from "@/components/taller-agente";
import { getCategories, getPublishedCourses } from "@/lib/courses";

// Pagina dependiente de la sesion y de la base de datos: la navegacion puede esperar al servidor.
export const instant = false;

export default async function Home() {
  const [categories, courses] = await Promise.all([getCategories(), getPublishedCourses()]);

  return (
    <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <section className="max-w-2xl">
        <h1 className="text-3xl font-semibold">Aprende marketing digital e inteligencia artificial</h1>
        <p className="mt-3 text-fg-2">
          Cursos practicos de instructores expertos: desde SEO y publicidad hasta automatizacion con IA.
        </p>
        <Link
          href="/cursos"
          className="mt-5 eb-btn eb-btn--primary"
        >
          Explorar cursos
        </Link>
      </section>

      <section className="mt-10" aria-labelledby="taller-titulo">
        <h2 id="taller-titulo" className="mb-1 text-lg font-semibold">El taller del agente</h2>
        <p className="mb-3 text-sm text-fg-3">
          Asi trabaja un agente de IA: recibe una tarea, usa herramientas, observa, corrige errores y recuerda lo aprendido.
        </p>
        <TallerAgente />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Categorias</h2>
        <ul className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/cursos?categoria=${c.slug}`}
                className="eb-pill inline-block"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="destacados-titulo">
        <h2 id="destacados-titulo" className="mb-3 text-lg font-semibold">Cursos destacados</h2>
        <FeaturedCourses courses={courses} showImage />
      </section>
    </main>
  );
}
