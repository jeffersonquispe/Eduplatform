"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth";

export type AuthState = { error?: string; notice?: string };

const ROLES = ["student", "instructor"] as const;

function homeFor(role: string) {
  return role === "instructor" ? "/instructor" : "/mis-cursos";
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const role = String(formData.get("role") ?? "");

  if (!email || !email.includes("@")) return { error: "Escribe un correo valido." };
  if (password.length < 8) return { error: "La contrasena debe tener al menos 8 caracteres." };
  if (!ROLES.includes(role as (typeof ROLES)[number])) return { error: "Elige un rol." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role, display_name: displayName } },
  });

  if (error) {
    if (/already registered/i.test(error.message)) {
      return { error: "Ese correo ya tiene una cuenta. Inicia sesion." };
    }
    return { error: "No se pudo crear la cuenta. Intentalo de nuevo." };
  }

  // Con confirmacion de correo activa, Supabase no devuelve error para un correo existente:
  // devuelve un usuario sin identidades.
  if (data.user && data.user.identities?.length === 0) {
    return { error: "Ese correo ya tiene una cuenta. Inicia sesion." };
  }

  if (!data.session) {
    return { notice: "Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesion." };
  }

  revalidatePath("/", "layout");
  redirect(homeFor(role));
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  // Mensaje unico: no revela si fallo el correo o la contrasena.
  if (error || !data.user) return { error: "Correo o contrasena incorrectos." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  revalidatePath("/", "layout");
  redirect(next ?? homeFor(profile?.role ?? "student"));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
