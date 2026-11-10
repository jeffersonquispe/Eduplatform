import Link from "next/link";
import { FeaturedCourses } from "@/components/featured-courses";
import { getPublishedCourses } from "@/lib/courses";

// Pagina dependiente de la base de datos (cursos destacados): la navegacion puede esperar al servidor.
export const instant = false;

export const metadata = { title: "Quienes somos" };

export default async function QuienesSomosPage() {
  const courses = await getPublishedCourses();

  return (
    <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <section className="max-w-2xl">
        <h1 className="text-3xl font-semibold">Quienes somos</h1>
        <p className="mt-3 text-fg-2">
          EduTech es una plataforma de cursos online enfocada en marketing digital e inteligencia artificial.
          Conectamos instructores expertos con estudiantes que quieren aprender habilidades practicas y
          aplicarlas de inmediato en su trabajo.
        </p>
        <p className="mt-3 text-fg-2">
          Cada curso se organiza en secciones y lecciones, con contenido escrito por el propio instructor y
          valoraciones de quienes ya lo tomaron. Un curso solo se publica cuando tiene titulo, descripcion,
          categoria y al menos una leccion.
        </p>
        <Link href="/cursos" className="mt-5 eb-btn eb-btn--primary">
          Explorar el catalogo
        </Link>
      </section>

      <section className="mt-10" aria-labelledby="destacados-titulo">
        <h2 id="destacados-titulo" className="mb-3 text-lg font-semibold">
          Cursos destacados
        </h2>
        <FeaturedCourses courses={courses} />
      </section>
    </main>
  );
}
