import Link from "next/link";
import { LoginForm } from "@/components/auth-forms";
import { safeNextPath } from "@/lib/auth";

// Pagina dependiente de la sesion y de la base de datos: la navegacion puede esperar al servidor.
export const instant = false;

export const metadata = { title: "Iniciar sesion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Iniciar sesion</h1>
      <LoginForm next={safeNextPath(next) ?? undefined} />
      <p className="mt-4 text-sm text-fg-2">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="text-link underline">
          Registrate
        </Link>
      </p>
    </main>
  );
}
