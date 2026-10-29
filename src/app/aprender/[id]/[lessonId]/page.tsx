import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { unenroll } from "@/app/actions/enrollments";
import { getLessonContent, requireCourseAccess } from "@/lib/learning";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function LessonPage({ params }: PageProps<"/aprender/[id]/[lessonId]">) {
  const { id, lessonId } = await params;
  if (!UUID.test(id) || !UUID.test(lessonId)) notFound();
  const { user, outline } = await requireCourseAccess(id, `/aprender/${id}/${lessonId}`);

  const flat = outline.sections.flatMap((s) => s.lessons.map((l) => ({ ...l, section: s.title })));
  const index = flat.findIndex((l) => l.id === lessonId);
  if (index < 0) notFound();
  const lesson = flat[index];

  // Si RLS no entrega el contenido, no hay acceso real (aunque la pagina haya resuelto el curso).
  const content = await getLessonContent(lessonId);
  if (!content) redirect(`/cursos/${id}`);

  const prev = flat[index - 1];
  const next = flat[index + 1];
  const isOwner = outline.instructor_id === user.id;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row">
      <aside className="md:w-72 md:shrink-0" aria-label="Contenido del curso">
        <Link href={isOwner ? `/instructor/cursos/${id}` : "/mis-cursos"} className="text-sm text-zinc-500 hover:underline">
          ← {isOwner ? "Volver al editor" : "Mis cursos"}
        </Link>
        <h2 className="mt-2 font-semibold">{outline.title}</h2>
        <nav className="mt-4 space-y-4">
          {outline.sections.map((s) => (
            <div key={s.id}>
              <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">{s.title}</p>
              <ul className="mt-1 space-y-0.5">
                {s.lessons.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/aprender/${id}/${l.id}`}
                      aria-current={l.id === lessonId ? "page" : undefined}
                      className={`block rounded-md px-2 py-1 text-sm ${
                        l.id === lessonId
                          ? "bg-zinc-100 font-medium dark:bg-zinc-800"
                          : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      }`}
                    >
                      {l.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <article className="min-w-0 flex-1">
        <p className="text-sm text-zinc-500">{lesson.section}</p>
        <h1 className="text-2xl font-semibold">{lesson.title}</h1>

        {content.video_url ? (
          <p className="mt-4">
            <a
              href={content.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Ver video de la leccion
            </a>
          </p>
        ) : null}

        {/* Texto plano: nunca HTML, asi el contenido del instructor no puede inyectar scripts. */}
        <div className="mt-4 whitespace-pre-line text-zinc-800 dark:text-zinc-200">{content.body}</div>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          {prev ? (
            <Link href={`/aprender/${id}/${prev.id}`} className="text-sm underline">
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/aprender/${id}/${next.id}`} className="text-sm underline">
              {next.title} →
            </Link>
          ) : (
            <span />
          )}
        </div>

        {!isOwner ? (
          <div className="mt-10">
            <ActionForm
              action={unenroll.bind(null, id)}
              submitLabel="Cancelar inscripcion"
              pendingLabel="Cancelando..."
              variant="danger"
              confirm="¿Cancelar tu inscripcion? Perderas el acceso al contenido del curso."
            />
          </div>
        ) : null}
      </article>
    </div>
  );
}
