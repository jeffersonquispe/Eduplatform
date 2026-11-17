"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { decideEnrollment } from "@/lib/enrollment";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/app/actions/courses";

export async function enroll(courseId: string, _prev: ActionState): Promise<ActionState> {
  const user = await getCurrentUser();
  const supabase = await createClient();

  // Estado de curso e inscripcion para decidir (RLS: un borrador ajeno no es visible y llega como null).
  let course: { status: string } | null = null;
  let alreadyEnrolled = false;
  if (user) {
    const [{ data: c }, { data: e }] = await Promise.all([
      supabase.from("courses").select("status").eq("id", courseId).maybeSingle(),
      supabase.from("enrollments").select("id").eq("course_id", courseId).eq("student_id", user.id).maybeSingle(),
    ]);
    course = c;
    alreadyEnrolled = !!e;
  }

  const decision = decideEnrollment({ user, course, alreadyEnrolled });
  if (!user || decision === "require-login") redirect(`/login?next=${encodeURIComponent(`/cursos/${courseId}`)}`);
  if (decision === "reject") {
    return {
      error:
        user.role !== "student"
          ? "Solo los estudiantes pueden inscribirse en cursos."
          : "No se pudo completar la inscripcion. El curso podria no estar disponible.",
    };
  }

  if (decision === "enroll") {
    const { error } = await supabase.from("enrollments").insert({ student_id: user.id, course_id: courseId });
    // 23505 = otra peticion se adelanto: se trata como exito, hay una sola inscripcion por curso.
    if (error && error.code !== "23505") {
      return { error: "No se pudo completar la inscripcion. El curso podria no estar disponible." };
    }
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
