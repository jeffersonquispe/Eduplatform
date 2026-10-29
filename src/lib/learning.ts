import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type Outline = {
  id: string;
  title: string;
  instructor_id: string;
  sections: {
    id: string;
    title: string;
    position: number;
    lessons: { id: string; title: string; position: number }[];
  }[];
};

export async function isEnrolled(courseId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_id", courseId)
    .eq("student_id", userId)
    .maybeSingle();
  return Boolean(data);
}

// Acceso al contenido: estudiante inscrito o instructor propietario.
// Sin sesion -> login; sin acceso -> pagina publica del curso. RLS lo vuelve a exigir en la base.
export async function requireCourseAccess(courseId: string, nextPath: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);

  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("id, title, instructor_id, sections(id, title, position, lessons(id, title, position))")
    .eq("id", courseId)
    .maybeSingle();
  const outline = data as unknown as Outline | null;

  const allowed = outline && (outline.instructor_id === user.id || (await isEnrolled(courseId, user.id)));
  if (!outline || !allowed) redirect(`/cursos/${courseId}`);

  const sections = [...outline.sections]
    .sort((a, b) => a.position - b.position)
    .map((s) => ({ ...s, lessons: [...s.lessons].sort((a, b) => a.position - b.position) }));

  return { user: user as CurrentUser, outline: { ...outline, sections } as Outline };
}

export async function getLessonContent(lessonId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lesson_contents")
    .select("body, video_url")
    .eq("lesson_id", lessonId)
    .maybeSingle();
  return data;
}

export async function getMyEnrollments(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("created_at, course:courses(id, title, description, status, instructor:profiles!instructor_id(id, display_name))")
    .eq("student_id", userId)
    .order("created_at", { ascending: false });

  type Row = {
    created_at: string;
    course: {
      id: string;
      title: string;
      description: string;
      status: string;
      instructor: { id: string; display_name: string } | null;
    } | null;
  };
  return ((data ?? []) as unknown as Row[]).filter((r) => r.course);
}
