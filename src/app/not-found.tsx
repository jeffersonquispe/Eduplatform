import Link from "next/link";

export const metadata = { title: "Pagina no encontrada" };

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Pagina no encontrada</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        El contenido que buscas no existe o ya no esta disponible.
      </p>
      <Link href="/cursos" className="mt-6 inline-block underline">
        Ver todos los cursos
      </Link>
    </main>
  );
}
