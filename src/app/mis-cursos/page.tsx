import Link from "next/link";
import { Badge, buttonClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getMyEnrollments } from "@/lib/learning";

// Pagina dependiente de la sesion y de la base de datos: la navegacion puede esperar al servidor.
export const instant = false;

export const metadata = { title: "Mis cursos" };

export default async function MyCoursesPage() {
  const user = await requireRole("student", "/mis-cursos");
  const enrollments = await getMyEnrollments(user.id);

  return (
    <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold">Mis cursos</h1>

      {enrollments.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-border-strong p-8 text-center">
          <p className="text-sm text-fg-3">Aun no estas inscrito en ningun curso.</p>
          <Link href="/cursos" className={`${buttonClass("primary", { sm: true })} mt-4`}>
            Explorar el catalogo
          </Link>
        </div>
      ) : (
        <ul className="eb-grid mt-6">
          {enrollments.map(({ course }) => (
            <li key={course!.id} className="eb-card">
              <h2 className="text-base font-semibold">{course!.title}</h2>
              {course!.instructor ? (
                <p className="mt-1 text-xs text-fg-2">Por {course!.instructor.display_name}</p>
              ) : null}
              {course!.status !== "published" ? (
                <p className="mt-2"><Badge tone="warning">Ya no esta en el catalogo</Badge></p>
              ) : null}
              <Link
                href={`/aprender/${course!.id}`}
                className="mt-auto pt-4 text-sm font-medium text-link hover:underline"
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
