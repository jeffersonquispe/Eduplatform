"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/app/actions/courses";

export async function enroll(courseId: string, _prev: ActionState): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/cursos/${courseId}`)}`);
  if (user.role !== "student") return { error: "Solo los estudiantes pueden inscribirse en cursos." };

  const supabase = await createClient();
  const { error } = await supabase.from("enrollments").insert({ student_id: user.id, course_id: courseId });

  // 23505 = ya estaba inscrito: se trata como exito, hay una sola inscripcion por curso.
  if (error && error.code !== "23505") {
    return { error: "No se pudo completar la inscripcion. El curso podria no estar disponible." };
  }

  revalidatePath(`/cursos/${courseId}`);
  revalidatePath("/mis-cursos");
  redirect(`/aprender/${courseId}`);
}

export async function unenroll(courseId: string, _prev: ActionState): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/cursos/${courseId}`)}`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("course_id", courseId)
    .eq("student_id", user.id);
  if (error) return { error: "No se pudo cancelar la inscripcion. Intentalo de nuevo." };

  revalidatePath(`/cursos/${courseId}`);
  revalidatePath("/mis-cursos");
  redirect(`/cursos/${courseId}`);
}
