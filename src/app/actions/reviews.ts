"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/app/actions/courses";

function parse(fd: FormData) {
  const rating = Number(fd.get("rating"));
  const raw = fd.get("comment");
  const comment = typeof raw === "string" ? raw.trim() : "";
  return { rating, comment: comment || null };
}

function invalid(rating: number, comment: string | null): ActionState | null {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "La calificacion debe ser un numero entero de 1 a 5." };
  }
  if (comment && comment.length > 2000) return { error: "El comentario no puede superar 2000 caracteres." };
  return null;
}

function refresh(courseId: string) {
  revalidatePath(`/cursos/${courseId}`);
  revalidatePath("/cursos");
  revalidatePath("/");
}

export async function createReview(courseId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Inicia sesion para dejar una resena." };

  const { rating, comment } = parse(fd);
  const problem = invalid(rating, comment);
  if (problem) return problem;

  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .insert({ course_id: courseId, student_id: user.id, rating, comment });

  if (error) {
    if (error.code === "23505") return { error: "Ya dejaste una resena en este curso. Puedes editarla." };
    if (error.code === "42501") return { error: "Solo los estudiantes inscritos en el curso pueden dejar una resena." };
    return { error: "No se pudo guardar la resena. Intentalo de nuevo." };
  }

  refresh(courseId);
  return { ok: "Gracias por tu resena." };
}

export async function updateReview(courseId: string, reviewId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Inicia sesion para editar tu resena." };

  const { rating, comment } = parse(fd);
  const problem = invalid(rating, comment);
  if (problem) return problem;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .update({ rating, comment })
    .eq("id", reviewId)
    .select("id");
  if (error) return { error: "No se pudo guardar la resena. Intentalo de nuevo." };
  if (!data?.length) return { error: "Solo puedes editar tu propia resena." };

  refresh(courseId);
  return { ok: "Resena actualizada." };
}

export async function deleteReview(courseId: string, reviewId: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Inicia sesion para eliminar tu resena." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("reviews").delete().eq("id", reviewId).select("id");
  if (error) return { error: "No se pudo eliminar la resena. Intentalo de nuevo." };
  if (!data?.length) return { error: "Solo puedes eliminar tu propia resena." };

  refresh(courseId);
  return {};
}
