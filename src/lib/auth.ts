import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "instructor" | "student";

export type CurrentUser = {
  id: string;
  email: string | null;
  role: Role;
  displayName: string;
};

// Una consulta por peticion aunque varios componentes la pidan.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", claims.sub)
    .single();
  if (!profile) return null;

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    role: profile.role as Role,
    displayName: profile.display_name,
  };
});

// Para paginas protegidas: sin sesion va a /login; con rol equivocado, al inicio.
export async function requireRole(role: Role, next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (user.role !== role) redirect("/");
  return user;
}

// Solo rutas internas: evita redirecciones abiertas con ?next=https://... o //evil.com
export function safeNextPath(value: FormDataEntryValue | string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}
