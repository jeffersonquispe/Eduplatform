import Link from "next/link";
import type { CourseSummary } from "@/lib/courses";

export function Rating({ avg, count }: { avg: number; count: number }) {
  if (count === 0) {
    return <span className="text-xs text-zinc-500">Aun sin valoraciones</span>;
  }
  return (
    <span className="text-xs text-zinc-600 dark:text-zinc-400">
      <span aria-hidden>★</span> {Number(avg).toLocaleString("es", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{" "}
      <span className="text-zinc-500">({count} {count === 1 ? "resena" : "resenas"})</span>
    </span>
  );
}

export function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <li className="flex flex-col rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      {course.category ? (
        <span className="mb-2 w-fit rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {course.category.name}
        </span>
      ) : null}
      <h3 className="font-semibold">
        <Link href={`/cursos/${course.id}`} className="hover:underline">
          {course.title}
        </Link>
      </h3>
      <p className="mt-1 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">{course.description}</p>
      <div className="mt-auto flex items-center justify-between pt-3">
        {course.instructor ? (
          <Link
            href={`/instructores/${course.instructor.id}`}
            className="text-xs text-zinc-600 hover:underline dark:text-zinc-400"
          >
            {course.instructor.display_name}
          </Link>
        ) : (
          <span />
        )}
        <Rating avg={course.rating_avg} count={course.rating_count} />
      </div>
    </li>
  );
}
