import Link from "next/link";
import { notFound } from "next/navigation";
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
const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

type LessonRow = {
  id: string;
  title: string;
  position: number;
  lesson_contents: { body: string; video_url: string | null } | { body: string; video_url: string | null }[] | null;
};
type SectionRow = { id: string; title: string; position: number; lessons: LessonRow[] };

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

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Link href="/instructor" className="text-sm text-zinc-500 hover:underline">
        ← Mis cursos
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{data.title}</h1>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            published
              ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          {published ? "Publicado" : "Borrador"}
        </span>
      </div>

      <section className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800" aria-labelledby="publicacion">
        <h2 id="publicacion" className="mb-2 font-semibold">
          Publicacion
        </h2>
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
          {published
            ? "El curso es visible en el catalogo. Si lo despublicas, los estudiantes inscritos conservan el acceso."
            : "Para publicar necesitas titulo, descripcion, categoria y al menos una leccion."}
        </p>
        <div className="flex flex-wrap items-start gap-3">
          {published ? (
            <>
              <ActionForm action={setCourseStatus.bind(null, id, "draft")} submitLabel="Despublicar" variant="secondary" />
              <Link href={`/cursos/${id}`} className="py-1.5 text-sm underline">
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
              <li key={section.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800" data-testid="section">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-zinc-200 p-3 dark:border-zinc-800">
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

                <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {lessons.map((lesson, li) => {
                    const content = Array.isArray(lesson.lesson_contents) ? lesson.lesson_contents[0] : lesson.lesson_contents;
                    return (
                      <li key={lesson.id} className="p-3" data-testid="lesson">
                        <details>
                          <summary className="cursor-pointer text-sm font-medium">{lesson.title}</summary>
                          <div className="mt-3 space-y-3">
                            <ActionForm action={updateLesson.bind(null, id, lesson.id)} submitLabel="Guardar leccion">
                              <div className="space-y-3">
                                <label className="block space-y-1 text-sm">
                                  <span>Titulo</span>
                                  <input name="title" required defaultValue={lesson.title} className={inputClass} />
                                </label>
                                <label className="block space-y-1 text-sm">
                                  <span>Contenido</span>
                                  <textarea name="body" rows={4} defaultValue={content?.body ?? ""} className={inputClass} />
                                </label>
                                <label className="block space-y-1 text-sm">
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

                <details className="border-t border-zinc-200 p-3 dark:border-zinc-800">
                  <summary className="cursor-pointer text-sm underline">Agregar leccion</summary>
                  <div className="mt-3">
                    <ActionForm action={addLesson.bind(null, id, section.id)} submitLabel="Agregar leccion" pendingLabel="Agregando...">
                      <div className="space-y-3">
                        <label className="block space-y-1 text-sm">
                          <span>Titulo de la leccion</span>
                          <input name="title" required className={inputClass} />
                        </label>
                        <label className="block space-y-1 text-sm">
                          <span>Contenido</span>
                          <textarea name="body" rows={3} className={inputClass} />
                        </label>
                        <label className="block space-y-1 text-sm">
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

        <div className="mt-5 rounded-lg border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
          <ActionForm action={addSection.bind(null, id)} submitLabel="Agregar seccion" pendingLabel="Agregando...">
            <label className="block space-y-1 text-sm">
              <span>Titulo de la nueva seccion</span>
              <input name="title" required className={inputClass} />
            </label>
          </ActionForm>
        </div>
      </section>

      <section className="mt-12 rounded-lg border border-red-200 p-4 dark:border-red-900" aria-labelledby="peligro">
        <h2 id="peligro" className="mb-2 font-semibold text-red-700 dark:text-red-300">
          Zona de peligro
        </h2>
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
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
