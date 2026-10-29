"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; ok?: string };

const NOT_ALLOWED: ActionState = { error: "No tienes permiso para hacer esto." };
const GENERIC: ActionState = { error: "No se pudo completar la accion. Intentalo de nuevo." };

// La autorizacion real la hace RLS; esto da un mensaje claro y evita llamadas inutiles.
async function instructorSession() {
  const user = await getCurrentUser();
  if (!user || user.role !== "instructor") return null;
  return { user, supabase: await createClient() };
}

function field(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function refresh(courseId: string) {
  revalidatePath(`/instructor/cursos/${courseId}`);
  revalidatePath("/instructor");
  revalidatePath("/cursos");
  revalidatePath(`/cursos/${courseId}`);
  revalidatePath("/");
}

function validVideo(url: string) {
  return url === "" || /^https?:\/\/\S+$/i.test(url);
}

// ---------- Cursos ----------

export async function createCourse(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const s = await instructorSession();
  if (!s) return NOT_ALLOWED;

  const title = field(fd, "title");
  const description = field(fd, "description");
  const categoryId = field(fd, "category_id");
  if (!title) return { error: "El titulo es obligatorio." };
  if (title.length > 200) return { error: "El titulo no puede superar 200 caracteres." };

  const { data, error } = await s.supabase
    .from("courses")
    .insert({ instructor_id: s.user.id, title, description, category_id: categoryId || null })
    .select("id")
    .single();
  if (error || !data) return GENERIC;

  revalidatePath("/instructor");
  redirect(`/instructor/cursos/${data.id}`);
}

export async function updateCourse(courseId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const s = await instructorSession();
  if (!s) return NOT_ALLOWED;

  const title = field(fd, "title");
  if (!title) return { error: "El titulo es obligatorio." };
  if (title.length > 200) return { error: "El titulo no puede superar 200 caracteres." };

  const { data, error } = await s.supabase
    .from("courses")
    .update({ title, description: field(fd, "description"), category_id: field(fd, "category_id") || null })
    .eq("id", courseId)
    .select("id");
  if (error) return GENERIC;
  if (!data?.length) return NOT_ALLOWED;

  refresh(courseId);
  return { ok: "Cambios guardados." };
}

export async function setCourseStatus(
  courseId: string,
  status: "draft" | "published",
  _prev: ActionState,
): Promise<ActionState> {
  const s = await instructorSession();
  if (!s) return NOT_ALLOWED;

  const { data, error } = await s.supabase.from("courses").update({ status }).eq("id", courseId).select("id");
  if (error) {
    // El trigger de publicacion indica que falta, por ejemplo: "falta: descripcion, al menos una leccion".
    if (error.message.startsWith("No se puede publicar")) return { error: error.message };
    return GENERIC;
  }
  if (!data?.length) return NOT_ALLOWED;

  refresh(courseId);
  return { ok: status === "published" ? "Curso publicado." : "Curso despublicado." };
}

export async function deleteCourse(courseId: string): Promise<ActionState> {
  const s = await instructorSession();
  if (!s) return NOT_ALLOWED;

  const { data, error } = await s.supabase.from("courses").delete().eq("id", courseId).select("id");
  if (error) return GENERIC;
  if (!data?.length) return NOT_ALLOWED;

  revalidatePath("/instructor");
  revalidatePath("/cursos");
  redirect("/instructor");
}

// ---------- Secciones ----------

export async function addSection(courseId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const s = await instructorSession();
  if (!s) return NOT_ALLOWED;

  const title = field(fd, "title");
  if (!title) return { error: "El titulo de la seccion es obligatorio." };

  const { data: last } = await s.supabase
    .from("sections")
    .select("position")
    .eq("course_id", courseId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await s.supabase
    .from("sections")
    .insert({ course_id: courseId, title, position: (last?.position ?? 0) + 1 });
  if (error) return NOT_ALLOWED;

  refresh(courseId);
  return { ok: "Seccion agregada." };
}

export async function renameSection(courseId: string, sectionId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const s = await instructorSession();
  if (!s) return NOT_ALLOWED;

  const title = field(fd, "title");
  if (!title) return { error: "El titulo de la seccion es obligatorio." };

  const { data, error } = await s.supabase.from("sections").update({ title }).eq("id", sectionId).select("id");
  if (error) return GENERIC;
  if (!data?.length) return NOT_ALLOWED;

  refresh(courseId);
  return { ok: "Seccion actualizada." };
}

export async function deleteSection(courseId: string, sectionId: string): Promise<ActionState> {
  const s = await instructorSession();
  if (!s) return NOT_ALLOWED;

  const { data, error } = await s.supabase.from("sections").delete().eq("id", sectionId).select("id");
  if (error) return GENERIC;
  if (!data?.length) return NOT_ALLOWED;

  refresh(courseId);
  return {};
}

export async function moveSection(courseId: string, sectionId: string, dir: -1 | 1): Promise<ActionState> {
  const s = await instructorSession();
  if (!s) return NOT_ALLOWED;

  const { data } = await s.supabase.from("sections").select("id").eq("course_id", courseId).order("position");
  const ids = (data ?? []).map((r) => r.id);
  const from = ids.indexOf(sectionId);
  const to = from + dir;
  if (from < 0 || to < 0 || to >= ids.length) return {};
  [ids[from], ids[to]] = [ids[to], ids[from]];

  const { error } = await s.supabase.rpc("reorder_sections", { p_course_id: courseId, p_section_ids: ids });
  if (error) return GENERIC;

  refresh(courseId);
  return {};
}

// ---------- Lecciones ----------

export async function addLesson(courseId: string, sectionId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const s = await instructorSession();
  if (!s) return NOT_ALLOWED;

  const title = field(fd, "title");
  const videoUrl = field(fd, "video_url");
  if (!title) return { error: "El titulo de la leccion es obligatorio." };
  if (!validVideo(videoUrl)) return { error: "El enlace de video debe empezar por http:// o https://." };

  const { error } = await s.supabase.rpc("create_lesson", {
    p_section_id: sectionId,
    p_title: title,
    p_body: field(fd, "body"),
    p_video_url: videoUrl,
  });
  if (error) return NOT_ALLOWED;

  refresh(courseId);
  return { ok: "Leccion agregada." };
}

export async function updateLesson(courseId: string, lessonId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const s = await instructorSession();
  if (!s) return NOT_ALLOWED;

  const title = field(fd, "title");
  const videoUrl = field(fd, "video_url");
  if (!title) return { error: "El titulo de la leccion es obligatorio." };
  if (!validVideo(videoUrl)) return { error: "El enlace de video debe empezar por http:// o https://." };

  const { data, error } = await s.supabase.from("lessons").update({ title }).eq("id", lessonId).select("id");
  if (error) return GENERIC;
  if (!data?.length) return NOT_ALLOWED;

  const { error: contentError } = await s.supabase
    .from("lesson_contents")
    .upsert({ lesson_id: lessonId, body: field(fd, "body"), video_url: videoUrl || null });
  if (contentError) return GENERIC;

  refresh(courseId);
  return { ok: "Leccion actualizada." };
}

export async function deleteLesson(courseId: string, lessonId: string): Promise<ActionState> {
  const s = await instructorSession();
  if (!s) return NOT_ALLOWED;

  const { data, error } = await s.supabase.from("lessons").delete().eq("id", lessonId).select("id");
  if (error) return GENERIC;
  if (!data?.length) return NOT_ALLOWED;

  refresh(courseId);
  return {};
}

export async function moveLesson(courseId: string, sectionId: string, lessonId: string, dir: -1 | 1): Promise<ActionState> {
  const s = await instructorSession();
  if (!s) return NOT_ALLOWED;

  const { data } = await s.supabase.from("lessons").select("id").eq("section_id", sectionId).order("position");
  const ids = (data ?? []).map((r) => r.id);
  const from = ids.indexOf(lessonId);
  const to = from + dir;
  if (from < 0 || to < 0 || to >= ids.length) return {};
  [ids[from], ids[to]] = [ids[to], ids[from]];

  const { error } = await s.supabase.rpc("reorder_lessons", { p_section_id: sectionId, p_lesson_ids: ids });
  if (error) return GENERIC;

  refresh(courseId);
  return {};
}
