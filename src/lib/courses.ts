import { createClient } from "@/lib/supabase/server";

export type CourseSummary = {
  id: string;
  title: string;
  description: string;
  rating_avg: number;
  rating_count: number;
  category: { slug: string; name: string } | null;
  instructor: { id: string; display_name: string } | null;
};

const SUMMARY_SELECT =
  "id, title, description, rating_avg, rating_count, category:categories(slug, name), instructor:profiles!instructor_id(id, display_name)";

export async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id, slug, name").order("name");
  return data ?? [];
}

// Catalogo publico: siempre filtra por publicado, aunque RLS tambien deja ver
// borradores propios y cursos despublicados en los que el usuario esta inscrito.
export async function getPublishedCourses(opts: { category?: string; q?: string } = {}) {
  const supabase = await createClient();

  let query = supabase
    .from("courses")
    .select(SUMMARY_SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const q = opts.q?.trim();
  if (q) query = query.textSearch("search", q, { config: "spanish", type: "websearch" });

  if (opts.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", opts.category)
      .maybeSingle();
    if (!cat) return [] as CourseSummary[];
    query = query.eq("category_id", cat.id);
  }

  const { data } = await query;
  return (data ?? []) as unknown as CourseSummary[];
}

export async function getInstructorProfile(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, bio, avatar_url, role")
    .eq("id", id)
    .eq("role", "instructor")
    .maybeSingle();
  if (!data) return null;

  const { data: courses } = await supabase
    .from("courses")
    .select(SUMMARY_SELECT)
    .eq("status", "published")
    .eq("instructor_id", id)
    .order("created_at", { ascending: false });

  return { profile: data, courses: (courses ?? []) as unknown as CourseSummary[] };
}

export type CourseDetail = {
  id: string;
  title: string;
  description: string;
  rating_avg: number;
  rating_count: number;
  updated_at: string;
  category: { slug: string; name: string } | null;
  instructor: { id: string; display_name: string; bio: string | null } | null;
  sections: {
    id: string;
    title: string;
    position: number;
    lessons: { id: string; title: string; position: number }[];
  }[];
};

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  student_id: string;
  student: { display_name: string } | null;
};

// Detalle publico: solo cursos publicados. Devuelve el temario (titulos), nunca el contenido de las lecciones.
export async function getPublishedCourse(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select(
      "id, title, description, rating_avg, rating_count, updated_at, category:categories(slug, name), instructor:profiles!instructor_id(id, display_name, bio), sections(id, title, position, lessons(id, title, position))",
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return null;

  const course = data as unknown as CourseDetail;
  course.sections = [...course.sections]
    .sort((a, b) => a.position - b.position)
    .map((s) => ({ ...s, lessons: [...s.lessons].sort((a, b) => a.position - b.position) }));
  return course;
}

export async function getCourseReviews(courseId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, student_id, student:profiles!student_id(display_name)")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as Review[];
}
