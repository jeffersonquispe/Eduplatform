import type { CourseSummary } from "@/lib/courses";
import { CourseCard } from "@/components/course-card";
import { EmptyState } from "@/components/ui";

// Muestra los 3 cursos publicados mas recientes (orden que ya trae getPublishedCourses).
export function FeaturedCourses({ courses, showImage = false }: { courses: CourseSummary[]; showImage?: boolean }) {
  const featured = courses.slice(0, 3);

  if (featured.length === 0) {
    return <EmptyState>Todavia no hay cursos publicados.</EmptyState>;
  }

  return (
    <ul className="eb-grid">
      {featured.map((course) => (
        <CourseCard key={course.id} course={course} showImage={showImage} />
      ))}
    </ul>
  );
}
