import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { buttonClass, EmptyState } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import type { CourseSummary } from "@/lib/courses";
import { createClient } from "@/lib/supabase/server";

// Pagina dependiente de la sesion y de la base de datos: la navegacion puede esperar al servidor.
export const instant = false;

export const metadata = { title: "Panel del instructor" };

export default async function InstructorPage({ searchParams }: PageProps<"/instructor">) {
  const { estado } = await searchParams;
  const filtro = estado === "published" || estado === "draft" ? estado : "all";
  const user = await requireRole("instructor", "/instructor");
  const supabase = await createClient();

  // Solo los cursos propios, con su numero de inscritos (RLS deja contar solo las de sus cursos).
  const { data } = await supabase
    .from("courses")
    .select("id, title, description, status, rating_avg, rating_count, updated_at, category:categories(slug, name), enrollments(count)")
    .eq("instructor_id", user.id)
    .order("updated_at", { ascending: false });
  const all = data ?? [];
  const courses = filtro === "all" ? all : all.filter((c) => c.status === filtro);
  const totalEnrolled = all.reduce((n, c) => n + (c.enrollments?.[0]?.count ?? 0), 0);
  const rated = all.filter((c) => c.rating_count > 0);
  const avgRating = rated.length ? rated.reduce((n, c) => n + Number(c.rating_avg), 0) / rated.length : null;
  const tabs = [
    { key: "all", label: "Todos", href: "/instructor", n: all.length },
    { key: "published", label: "Publicados", href: "/instructor?estado=published", n: all.filter((c) => c.status === "published").length },
    { key: "draft", label: "Borradores", href: "/instructor?estado=draft", n: all.filter((c) => c.status !== "published").length },
  ];

  return (
    <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Panel del instructor</h1>
        <Link href="/instructor/cursos/nuevo" className={buttonClass("primary", { sm: true })}>
          Nuevo curso
        </Link>
      </div>

      {all.length > 0 ? (
        <>
          <dl className="mt-6 grid grid-cols-3 gap-4">
            {[
              ["Cursos", String(all.length)],
              ["Inscritos", String(totalEnrolled)],
              ["Valoracion media", avgRating === null ? "—" : avgRating.toLocaleString("es", { minimumFractionDigits: 1, maximumFractionDigits: 1 })],
            ].map(([label, value]) => (
              <div key={label} className="eb-surface p-4">
                <dt className="text-xs text-fg-3">{label}</dt>
                <dd className="mt-1 text-2xl font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <nav aria-label="Filtrar por estado" className="mt-6 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <Link key={t.key} href={t.href} aria-current={filtro === t.key ? "page" : undefined} className={`eb-pill${filtro === t.key ? " eb-pill--active" : ""}`}>
                {t.label} ({t.n})
              </Link>
            ))}
          </nav>
        </>
      ) : null}

      {all.length === 0 ? (
        <div className="mt-8">
          <EmptyState>
            <p>Aun no has creado cursos. Crea el primero para empezar.</p>
            <Link href="/instructor/cursos/nuevo" className={`${buttonClass("primary", { sm: true })} mt-4`}>
              Crear mi primer curso
            </Link>
          </EmptyState>
        </div>
      ) : courses.length === 0 ? (
        <p className="mt-6 text-sm text-fg-3">No hay cursos con este estado.</p>
      ) : (
        <ul className="eb-grid mt-6">
          {courses.map((c) => {
            const enrolled = c.enrollments?.[0]?.count ?? 0;
            const href = `/instructor/cursos/${c.id}`;
            return (
              <CourseCard
                key={c.id}
                variant="instructor"
                status={c.status}
                href={href}
                course={{ ...c, instructor: null } as unknown as CourseSummary}
                meta={`${enrolled} ${enrolled === 1 ? "inscrito" : "inscritos"}`}
                actions={
                  <Link href={href} className={buttonClass("secondary", { sm: true })}>
                    Editar
                  </Link>
                }
              />
            );
          })}
        </ul>
      )}
    </main>
  );
}
