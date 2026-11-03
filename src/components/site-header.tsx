import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import { NavLink } from "@/components/nav-link";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="eb-header">
      <nav>
        <div className="flex items-center gap-5">
          <Link href="/" className="eb-brand">
            EduTech
          </Link>
          <NavLink href="/cursos">Cursos</NavLink>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <NavLink href={user.role === "instructor" ? "/instructor" : "/mis-cursos"}>
                {user.role === "instructor" ? "Panel" : "Mis cursos"}
              </NavLink>
              <span className="text-fg-3">{user.displayName}</span>
              <form action={signOut}>
                <button type="submit" className="text-fg-2 underline hover:text-fg-1">
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="underline">
                Iniciar sesion
              </Link>
              <Link href="/registro" className="eb-btn eb-btn--primary eb-btn--sm">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
