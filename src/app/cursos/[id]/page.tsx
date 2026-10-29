import Link from "next/link";
import { notFound } from "next/navigation";
import { enroll } from "@/app/actions/enrollments";
import { createReview, deleteReview, updateReview } from "@/app/actions/reviews";
import { ReviewFields } from "@/components/review-fields";
import { ActionForm } from "@/components/action-form";
import { Rating } from "@/components/course-card";
import { getCurrentUser } from "@/lib/auth";
import { getCourseReviews, getPublishedCourse } from "@/lib/courses";
import { isEnrolled } from "@/lib/learning";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      {course.category ? (
        <Link
          href={`/cursos?categoria=${course.category.slug}`}
          className="text-sm text-zinc-500 hover:underline"
        >
          {course.category.name}
        </Link>
      ) : null}
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{course.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <Rating avg={course.rating_avg} count={course.rating_count} />
        {course.instructor ? (
          <span>
            Por{" "}
            <Link href={`/instructores/${course.instructor.id}`} className="underline">
              {course.instructor.display_name}
            </Link>
          </span>
        ) : null}
        <span className="text-zinc-500">
          Actualizado el {new Date(course.updated_at).toLocaleDateString("es", { dateStyle: "long" })}
        </span>
      </div>

      <div className="mt-5">
        {!user ? (
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/login?next=${encodeURIComponent(`/cursos/${course.id}`)}`}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Inicia sesion para inscribirte
            </Link>
            <Link href="/registro" className="text-sm underline">
              Crear cuenta
            </Link>
          </div>
        ) : user.role === "student" ? (
          enrolled ? (
            <Link
              href={`/aprender/${course.id}`}
              className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Ir al curso
            </Link>
          ) : (
            <ActionForm action={enroll.bind(null, course.id)} submitLabel="Inscribirme gratis" pendingLabel="Inscribiendo..." />
          )
        ) : course.instructor?.id === user.id ? (
          <Link href={`/instructor/cursos/${course.id}`} className="text-sm underline">
            Editar este curso
          </Link>
        ) : (
          <p className="text-sm text-zinc-500">Las cuentas de instructor no pueden inscribirse en cursos.</p>
        )}
      </div>

      <p className="mt-6 max-w-3xl whitespace-pre-line text-zinc-700 dark:text-zinc-300">{course.description}</p>

      <section className="mt-10" aria-labelledby="temario">
        <h2 id="temario" className="mb-3 text-lg font-semibold">
          Temario{" "}
          <span className="text-sm font-normal text-zinc-500">
            ({course.sections.length} {course.sections.length === 1 ? "seccion" : "secciones"}, {lessonCount}{" "}
            {lessonCount === 1 ? "leccion" : "lecciones"})
          </span>
        </h2>
        <ol className="space-y-3">
          {course.sections.map((s) => (
            <li key={s.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800">
              <h3 className="border-b border-zinc-200 px-4 py-2 font-medium dark:border-zinc-800">{s.title}</h3>
              <ul className="divide-y divide-zinc-100 text-sm dark:divide-zinc-900">
                {s.lessons.map((l) => (
                  <li key={l.id} className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
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
          <div className="mb-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
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
          <p className="text-sm text-zinc-500">Este curso aun no tiene valoraciones.</p>
        ) : (
          <ul className="space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{r.student?.display_name ?? "Estudiante"}</span>
                  <span aria-label={`${r.rating} de 5`}>
                    {"★".repeat(r.rating)}
                    <span className="text-zinc-300 dark:text-zinc-700">{"★".repeat(5 - r.rating)}</span>
                  </span>
                </div>
                {r.comment ? <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{r.comment}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
