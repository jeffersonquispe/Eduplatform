import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { unenroll } from "@/app/actions/enrollments";
import { getLessonContent, getLessonTitle, requireCourseAccess } from "@/lib/learning";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Pagina dependiente de la sesion y de la base de datos: la navegacion puede esperar al servidor.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/aprender/[id]/[lessonId]">) {
  const { id, lessonId } = await params;
  if (!UUID.test(id) || !UUID.test(lessonId)) return {};
  const title = await getLessonTitle(lessonId);
  return title ? { title } : {};
}

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
    <main id="contenido" tabIndex={-1} className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row">
      <aside className="md:w-72 md:shrink-0" aria-label="Contenido del curso">
        <Link href={isOwner ? `/instructor/cursos/${id}` : "/mis-cursos"} className="text-sm text-fg-3 hover:underline">
          ← {isOwner ? "Volver al editor" : "Mis cursos"}
        </Link>
        <h2 className="mt-2 font-semibold">{outline.title}</h2>
        <p className="mt-2 text-xs text-fg-3">
          Leccion {index + 1} de {flat.length}
        </p>
        <div className="eb-progress mt-1" role="progressbar" aria-valuemin={1} aria-valuemax={flat.length} aria-valuenow={index + 1} aria-label="Posicion en el curso">
          <span style={{ width: `${((index + 1) / flat.length) * 100}%` }} />
        </div>
        <nav className="mt-4 space-y-4">
          {outline.sections.map((s) => (
            <div key={s.id}>
              <p className="text-xs font-semibold tracking-wide text-fg-3 uppercase">{s.title}</p>
              <ul className="mt-1 space-y-0.5">
                {s.lessons.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/aprender/${id}/${l.id}`}
                      aria-current={l.id === lessonId ? "page" : undefined}
                      className={`block rounded-md px-2 py-1 text-sm ${
                        l.id === lessonId
                          ? "bg-subtle font-medium text-fg-1"
                          : "text-fg-2 hover:bg-subtle"
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
        <p className="text-sm text-fg-3">{lesson.section}</p>
        <h1 className="text-2xl font-semibold">{lesson.title}</h1>

        {content.video_url ? (
          <p className="mt-4">
            <a
              href={content.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="eb-btn eb-btn--secondary eb-btn--sm"
            >
              Ver video de la leccion
            </a>
          </p>
        ) : null}

        {/* Texto plano: nunca HTML, asi el contenido del instructor no puede inyectar scripts. */}
        <div className="mt-4 whitespace-pre-line text-fg-1">{content.body}</div>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-4">
          {prev ? (
            <Link href={`/aprender/${id}/${prev.id}`} className="eb-btn eb-btn--secondary eb-btn--sm">
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/aprender/${id}/${next.id}`} className="eb-btn eb-btn--primary eb-btn--sm">
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
    </main>
  );
}
