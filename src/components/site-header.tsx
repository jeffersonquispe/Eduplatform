import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import { NavLink } from "@/components/nav-link";

// Marcador mientras se resuelve la sesion: mismas medidas que la cabecera real (enlaces publicos reales y la zona
// de cuenta reservada con elementos invisibles) para que, al llegar el usuario, el contenido no se desplace.
export function SiteHeaderFallback() {
  return (
    <header className="eb-header">
      <nav>
        <div className="flex items-center gap-5">
          <Link href="/" className="eb-brand">
            EduTech
          </Link>
          <Link href="/cursos">Cursos</Link>
          <Link href="/quienes-somos">Quienes somos</Link>
        </div>
        <div className="flex items-center gap-4" aria-hidden="true">
          <span className="invisible">Iniciar sesion</span>
          <span className="eb-btn eb-btn--primary eb-btn--sm invisible">Crear cuenta</span>
        </div>
      </nav>
    </header>
  );
}

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
          <NavLink href="/quienes-somos">Quienes somos</NavLink>
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
