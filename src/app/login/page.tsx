import Link from "next/link";
import { LoginForm } from "@/components/auth-forms";
import { safeNextPath } from "@/lib/auth";

export const metadata = { title: "Iniciar sesion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Iniciar sesion</h1>
      <LoginForm next={safeNextPath(next) ?? undefined} />
      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="underline">
          Registrate
        </Link>
      </p>
    </main>
  );
}
