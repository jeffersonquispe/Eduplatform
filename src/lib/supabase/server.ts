import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

// Cliente con la sesion del usuario (clave anon + JWT): RLS decide que filas ve.
// La clave service_role no se usa en la aplicacion.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Los datos dependen del usuario y cambian con cada escritura: Next no debe cachear
      // las respuestas de PostgREST (una consulta anonima identica reusaba datos viejos).
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Llamado desde un Server Component: no puede escribir cookies.
            // El proxy ya refresca la sesion, asi que se ignora.
          }
        },
      },
    },
  );
}
