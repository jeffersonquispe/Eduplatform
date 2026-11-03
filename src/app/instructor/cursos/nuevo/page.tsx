import { ActionForm } from "@/components/action-form";
import { CourseFields } from "@/components/course-fields";
import { createCourse } from "@/app/actions/courses";
import { requireRole } from "@/lib/auth";
import { getCategories } from "@/lib/courses";

// Pagina dependiente de la sesion y de la base de datos: la navegacion puede esperar al servidor.
export const instant = false;

export const metadata = { title: "Nuevo curso" };

export default async function NewCoursePage() {
  await requireRole("instructor", "/instructor/cursos/nuevo");
  const categories = await getCategories();

  return (
    <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Nuevo curso</h1>
      <ActionForm action={createCourse} submitLabel="Crear curso" pendingLabel="Creando...">
        <CourseFields categories={categories} />
      </ActionForm>
      <p className="mt-4 text-sm text-fg-3">El curso se crea como borrador; podras publicarlo cuando tenga lecciones.</p>
    </main>
  );
}
