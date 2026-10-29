import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireCourseAccess } from "@/lib/learning";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function LearnIndexPage({ params }: PageProps<"/aprender/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { outline } = await requireCourseAccess(id, `/aprender/${id}`);

  const first = outline.sections.flatMap((s) => s.lessons)[0];
  if (first) redirect(`/aprender/${id}/${first.id}`);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold">{outline.title}</h1>
      <p className="mt-3 text-sm text-zinc-500">Este curso todavia no tiene lecciones.</p>
      <Link href="/mis-cursos" className="mt-4 inline-block text-sm underline">
        Volver a mis cursos
      </Link>
    </main>
  );
}
