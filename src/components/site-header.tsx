import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 text-sm">
        <div className="flex items-center gap-5">
          <Link href="/" className="font-semibold">
            Plataforma de cursos
          </Link>
          <Link href="/cursos" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            Cursos
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href={user.role === "instructor" ? "/instructor" : "/mis-cursos"}
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {user.role === "instructor" ? "Panel" : "Mis cursos"}
              </Link>
              <span className="text-zinc-500">{user.displayName}</span>
              <form action={signOut}>
                <button type="submit" className="underline">
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="underline">
                Iniciar sesion
              </Link>
              <Link href="/registro" className="rounded-md bg-zinc-900 px-3 py-1.5 text-white dark:bg-zinc-100 dark:text-zinc-900">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
