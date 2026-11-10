import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge, inputClass } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { CourseFields } from "@/components/course-fields";
import {
  addLesson,
  addSection,
  deleteCourse,
  deleteLesson,
  deleteSection,
  moveLesson,
  moveSection,
  renameSection,
  setCourseStatus,
  updateCourse,
  updateLesson,
} from "@/app/actions/courses";
import { requireRole } from "@/lib/auth";
import { getCategories } from "@/lib/courses";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type LessonRow = {
  id: string;
  title: string;
  position: number;
  lesson_contents: { body: string; video_url: string | null } | { body: string; video_url: string | null }[] | null;
};
type SectionRow = { id: string; title: string; position: number; lessons: LessonRow[] };

// Pagina dependiente de la sesion y de la base de datos: la navegacion puede esperar al servidor.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/instructor/cursos/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) return {};
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("title").eq("id", id).maybeSingle();
  return data ? { title: data.title } : {};
}

export default async function EditCoursePage({ params }: PageProps<"/instructor/cursos/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const user = await requireRole("instructor", `/instructor/cursos/${id}`);

  const supabase = await createClient();
  const [{ data }, categories] = await Promise.all([
    supabase
      .from("courses")
      .select(
        "id, title, description, status, category_id, instructor_id, sections(id, title, position, lessons(id, title, position, lesson_contents(body, video_url)))",
      )
      .eq("id", id)
      .maybeSingle(),
    getCategories(),
  ]);

  // RLS deja ver cursos publicados de otros; en el editor solo entra el propietario.
  if (!data || data.instructor_id !== user.id) notFound();

  const sections = ([...(data.sections as unknown as SectionRow[])]).sort((a, b) => a.position - b.position);
  const published = data.status === "published";
  const lessonTotal = sections.reduce((n, s) => n + s.lessons.length, 0);
  // Solo orienta: la barrera real es el trigger de la base de datos.
  const requirements = [
    { label: "Titulo", ok: data.title.trim().length > 0 },
    { label: "Descripcion", ok: data.description.trim().length > 0 },
    { label: "Categoria", ok: data.category_id !== null },
    { label: "Al menos una leccion", ok: lessonTotal > 0 },
  ];

  return (
    <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Link href="/instructor" className="text-sm text-fg-3 hover:underline">
        ← Mis cursos
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{data.title}</h1>
        <StatusBadge status={data.status} />
      </div>

      <section className="mt-6 eb-surface p-4" aria-labelledby="publicacion">
        <h2 id="publicacion" className="mb-2 font-semibold">
          Publicacion
        </h2>
        <p className="mb-3 text-sm text-fg-2">
          {published
            ? "El curso es visible en el catalogo. Si lo despublicas, los estudiantes inscritos conservan el acceso."
            : "Para publicar necesitas titulo, descripcion, categoria y al menos una leccion."}
        </p>
        {!published ? (
          <ul className="mb-3 space-y-1 text-sm" aria-label="Requisitos para publicar">
            {requirements.map((r) => (
              <li key={r.label} className={r.ok ? "text-success-fg" : "text-fg-2"}>
                <span aria-hidden>{r.ok ? "✓" : "○"}</span> {r.label}
                <span className="sr-only">{r.ok ? " (listo)" : " (pendiente)"}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-wrap items-start gap-3">
          {published ? (
            <>
              <ActionForm action={setCourseStatus.bind(null, id, "draft")} submitLabel="Despublicar" variant="secondary" />
              <Link href={`/cursos/${id}`} className="py-1.5 text-sm text-link underline">
                Ver en el catalogo
              </Link>
            </>
          ) : (
            <ActionForm action={setCourseStatus.bind(null, id, "published")} submitLabel="Publicar curso" pendingLabel="Publicando..." />
          )}
        </div>
      </section>

      <section className="mt-6" aria-labelledby="detalles">
        <h2 id="detalles" className="mb-3 font-semibold">
          Detalles del curso
        </h2>
        <ActionForm action={updateCourse.bind(null, id)} submitLabel="Guardar cambios">
          <CourseFields
            categories={categories}
            defaults={{ title: data.title, description: data.description, category_id: data.category_id }}
          />
        </ActionForm>
      </section>

      <section className="mt-10" aria-labelledby="contenido">
        <h2 id="contenido" className="mb-3 font-semibold">
          Contenido
        </h2>

        <ol className="space-y-5">
          {sections.map((section, si) => {
            const lessons = [...section.lessons].sort((a, b) => a.position - b.position);
            return (
              <li key={section.id} className="eb-surface" data-testid="section">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border p-3">
                  <ActionForm
                    action={renameSection.bind(null, id, section.id)}
                    submitLabel="Renombrar"
                    variant="secondary"
                    className="flex flex-wrap items-start gap-2"
                  >
                    <input
                      name="title"
                      required
                      defaultValue={section.title}
                      aria-label={`Titulo de la seccion ${section.title}`}
                      className={`${inputClass} w-64`}
                    />
                  </ActionForm>
                  <div className="flex flex-wrap gap-2">
                    {si > 0 ? (
                      <ActionForm action={moveSection.bind(null, id, section.id, -1)} submitLabel="Subir" variant="secondary" />
                    ) : null}
                    {si < sections.length - 1 ? (
                      <ActionForm action={moveSection.bind(null, id, section.id, 1)} submitLabel="Bajar" variant="secondary" />
                    ) : null}
                    <ActionForm
                      action={deleteSection.bind(null, id, section.id)}
                      submitLabel="Eliminar seccion"
                      variant="danger"
                      confirm={`¿Eliminar la seccion "${section.title}" y todas sus lecciones?`}
                    />
                  </div>
                </div>

                <ul className="divide-y divide-border">
                  {lessons.map((lesson, li) => {
                    const content = Array.isArray(lesson.lesson_contents) ? lesson.lesson_contents[0] : lesson.lesson_contents;
                    return (
                      <li key={lesson.id} className="p-3" data-testid="lesson">
                        <details>
                          <summary className="cursor-pointer text-sm font-medium">{lesson.title}</summary>
                          <div className="mt-3 space-y-3">
                            <ActionForm action={updateLesson.bind(null, id, lesson.id)} submitLabel="Guardar leccion">
                              <div className="space-y-3">
                                <label className="eb-label">
                                  <span>Titulo</span>
                                  <input name="title" required defaultValue={lesson.title} className={inputClass} />
                                </label>
                                <label className="eb-label">
                                  <span>Contenido</span>
                                  <textarea name="body" rows={4} defaultValue={content?.body ?? ""} className={inputClass} />
                                </label>
                                <label className="eb-label">
                                  <span>Enlace de video (opcional)</span>
                                  <input name="video_url" type="url" defaultValue={content?.video_url ?? ""} className={inputClass} />
                                </label>
                              </div>
                            </ActionForm>
                            <div className="flex flex-wrap gap-2">
                              {li > 0 ? (
                                <ActionForm action={moveLesson.bind(null, id, section.id, lesson.id, -1)} submitLabel="Subir leccion" variant="secondary" />
                              ) : null}
                              {li < lessons.length - 1 ? (
                                <ActionForm action={moveLesson.bind(null, id, section.id, lesson.id, 1)} submitLabel="Bajar leccion" variant="secondary" />
                              ) : null}
                              <ActionForm
                                action={deleteLesson.bind(null, id, lesson.id)}
                                submitLabel="Eliminar leccion"
                                variant="danger"
                                confirm={`¿Eliminar la leccion "${lesson.title}"?`}
                              />
                            </div>
                          </div>
                        </details>
                      </li>
                    );
                  })}
                </ul>

                <details className="border-t border-border p-3">
                  <summary className="cursor-pointer text-sm underline">Agregar leccion</summary>
                  <div className="mt-3">
                    <ActionForm action={addLesson.bind(null, id, section.id)} submitLabel="Agregar leccion" pendingLabel="Agregando...">
                      <div className="space-y-3">
                        <label className="eb-label">
                          <span>Titulo de la leccion</span>
                          <input name="title" required className={inputClass} />
                        </label>
                        <label className="eb-label">
                          <span>Contenido</span>
                          <textarea name="body" rows={3} className={inputClass} />
                        </label>
                        <label className="eb-label">
                          <span>Enlace de video (opcional)</span>
                          <input name="video_url" type="url" className={inputClass} />
                        </label>
                      </div>
                    </ActionForm>
                  </div>
                </details>
              </li>
            );
          })}
        </ol>

        <div className="mt-5 rounded-lg border border-dashed border-border-strong p-4">
          <ActionForm action={addSection.bind(null, id)} submitLabel="Agregar seccion" pendingLabel="Agregando...">
            <label className="eb-label">
              <span>Titulo de la nueva seccion</span>
              <input name="title" required className={inputClass} />
            </label>
          </ActionForm>
        </div>
      </section>

      <section className="mt-12 rounded-lg border border-danger-border p-4" aria-labelledby="peligro">
        <h2 id="peligro" className="mb-2 font-semibold text-danger-fg">
          Zona de peligro
        </h2>
        <p className="mb-3 text-sm text-fg-2">
          Eliminar el curso borra sus secciones, lecciones, inscripciones y resenas. No se puede deshacer.
        </p>
        <ActionForm
          action={deleteCourse.bind(null, id)}
          submitLabel="Eliminar curso"
          variant="danger"
          confirm={`¿Eliminar definitivamente "${data.title}"?`}
        />
      </section>
    </main>
  );
}
