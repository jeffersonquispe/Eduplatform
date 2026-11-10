import Link from "next/link";
import { notFound } from "next/navigation";
import { enroll } from "@/app/actions/enrollments";
import { createReview, deleteReview, updateReview } from "@/app/actions/reviews";
import { ReviewFields } from "@/components/review-fields";
import { Alert } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { Rating } from "@/components/course-card";
import { getCurrentUser } from "@/lib/auth";
import { getCourseReviews, getPublishedCourse } from "@/lib/courses";
import { isEnrolled } from "@/lib/learning";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Pagina dependiente de la sesion y de la base de datos: la navegacion puede esperar al servidor.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/cursos/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) return {};
  const course = await getPublishedCourse(id);
  return course ? { title: course.title } : {};
}

export default async function CourseDetailPage({ params }: PageProps<"/cursos/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const course = await getPublishedCourse(id);
  if (!course) notFound();
  const reviews = await getCourseReviews(course.id);
  const user = await getCurrentUser();
  const enrolled = user?.role === "student" ? await isEnrolled(course.id, user.id) : false;
  const myReview = user ? reviews.find((r) => r.student_id === user.id) : undefined;
  const lessonCount = course.sections.reduce((n, s) => n + s.lessons.length, 0);

  return (
    <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
      {course.category ? (
        <Link
          href={`/cursos?categoria=${course.category.slug}`}
          className="text-sm text-fg-3 hover:underline"
        >
          {course.category.name}
        </Link>
      ) : null}
      <h1 className="mt-1 text-3xl font-semibold">{course.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <Rating avg={course.rating_avg} count={course.rating_count} />
        {course.instructor ? (
          <span>
            Por{" "}
            <Link href={`/instructores/${course.instructor.id}`} className="text-link underline">
              {course.instructor.display_name}
            </Link>
          </span>
        ) : null}
        <span className="text-fg-3">
          Actualizado el {new Date(course.updated_at).toLocaleDateString("es", { dateStyle: "long" })}
        </span>
      </div>


      <p className="mt-6 max-w-3xl whitespace-pre-line text-fg-2">{course.description}</p>

      <section className="mt-10" aria-labelledby="temario">
        <h2 id="temario" className="mb-3 text-lg font-semibold">
          Temario{" "}
          <span className="text-sm font-normal text-fg-3">
            ({course.sections.length} {course.sections.length === 1 ? "seccion" : "secciones"}, {lessonCount}{" "}
            {lessonCount === 1 ? "leccion" : "lecciones"})
          </span>
        </h2>
        <ol className="space-y-3">
          {course.sections.map((s) => (
            <li key={s.id} className="eb-surface">
              <h3 className="border-b border-border px-4 py-2 font-medium">{s.title}</h3>
              <ul className="divide-y divide-border text-sm">
                {s.lessons.map((l) => (
                  <li key={l.id} className="px-4 py-2 text-fg-2">
                    {l.title}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10" aria-labelledby="resenas">
        <h2 id="resenas" className="mb-3 text-lg font-semibold">
          Resenas
        </h2>

        {enrolled ? (
          <div className="mb-6 eb-surface p-4">
            {myReview ? (
              <>
                <h3 className="mb-3 font-medium">Tu resena</h3>
                <ActionForm
                  action={updateReview.bind(null, course.id, myReview.id)}
                  submitLabel="Guardar resena"
                  variant="secondary"
                >
                  <ReviewFields defaults={{ rating: myReview.rating, comment: myReview.comment }} />
                </ActionForm>
                <div className="mt-3">
                  <ActionForm
                    action={deleteReview.bind(null, course.id, myReview.id)}
                    submitLabel="Eliminar resena"
                    variant="danger"
                    confirm="¿Eliminar tu resena?"
                  />
                </div>
              </>
            ) : (
              <>
                <h3 className="mb-3 font-medium">Deja tu resena</h3>
                <ActionForm action={createReview.bind(null, course.id)} submitLabel="Publicar resena" pendingLabel="Publicando...">
                  <ReviewFields />
                </ActionForm>
              </>
            )}
          </div>
        ) : null}

        {reviews.length === 0 ? (
          <p className="text-sm text-fg-3">Este curso aun no tiene valoraciones.</p>
        ) : (
          <ul className="space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="eb-surface p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{r.student?.display_name ?? "Estudiante"}</span>
                  <span aria-label={`${r.rating} de 5`}>
                    {"★".repeat(r.rating)}
                    <span className="text-border-strong">{"★".repeat(5 - r.rating)}</span>
                  </span>
                </div>
                {r.comment ? <p className="mt-2 text-sm text-fg-2">{r.comment}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start" aria-label="Inscripcion">
        <div className="eb-surface space-y-4 p-4">
      <div >
        {!user ? (
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/login?next=${encodeURIComponent(`/cursos/${course.id}`)}`}
              className="eb-btn eb-btn--primary"
            >
              Inicia sesion para inscribirte
            </Link>
            <Link href="/registro" className="text-sm text-link underline">
              Crear cuenta
            </Link>
          </div>
        ) : user.role === "student" ? (
          enrolled ? (
            <Link
              href={`/aprender/${course.id}`}
              className="inline-block eb-btn eb-btn--primary"
            >
              Ir al curso
            </Link>
          ) : (
            <ActionForm action={enroll.bind(null, course.id)} submitLabel="Inscribirme gratis" pendingLabel="Inscribiendo..." />
          )
        ) : course.instructor?.id === user.id ? (
          <Link href={`/instructor/cursos/${course.id}`} className="text-sm text-link underline">
            Editar este curso
          </Link>
        ) : (
          <Alert tone="info">Las cuentas de instructor no pueden inscribirse en cursos.</Alert>
        )}
      </div>
          <dl className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-fg-3">Secciones</dt><dd>{course.sections.length}</dd></div>
            <div className="flex justify-between"><dt className="text-fg-3">Lecciones</dt><dd>{lessonCount}</dd></div>
            <div className="flex justify-between"><dt className="text-fg-3">Precio</dt><dd>Gratis</dd></div>
          </dl>
        </div>
      </aside>
      </div>
    </main>
  );
}
