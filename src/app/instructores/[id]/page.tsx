import { notFound } from "next/navigation";
import { CourseCard } from "@/components/course-card";
import { getInstructorProfile } from "@/lib/courses";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function InstructorProfilePage({ params }: PageProps<"/instructores/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const result = await getInstructorProfile(id);
  if (!result) notFound();
  const { profile, courses } = result;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{profile.display_name}</h1>
      {profile.bio ? (
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">{profile.bio}</p>
      ) : null}

      <h2 className="mt-8 mb-3 text-lg font-semibold">Cursos</h2>
      {courses.length === 0 ? (
        <p className="text-sm text-zinc-500">Este instructor aun no tiene cursos publicados.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </ul>
      )}
    </main>
  );
}
