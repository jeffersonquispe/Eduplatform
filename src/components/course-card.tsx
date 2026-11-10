import Link from "next/link";
import type { ReactNode } from "react";
import type { CourseSummary } from "@/lib/courses";
import { coursePlaceholder } from "@/lib/course-placeholder";
import { Badge, StatusBadge } from "@/components/ui";

export function Rating({ avg, count }: { avg: number; count: number }) {
  if (count === 0) {
    return <span className="text-xs text-fg-3">Aun sin valoraciones</span>;
  }
  return (
    <span className="text-xs text-fg-2">
      <span className="sr-only">Valoración: </span>
      <span aria-hidden className="text-star">★</span>{" "}
      {Number(avg).toLocaleString("es", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{" "}
      <span className="text-fg-3">({count} {count === 1 ? "resena" : "resenas"})</span>
    </span>
  );
}

type Props = {
  course: CourseSummary;
  variant?: "catalog" | "instructor";
  status?: string;
  // Variante instructor: el titulo abre el editor y el pie lleva las acciones.
  href?: string;
  actions?: ReactNode;
  // Variante instructor: dato secundario bajo la descripcion (p. ej. inscritos).
  meta?: ReactNode;
  // Ilustracion generica por categoria (los cursos no tienen imagen propia en la BD).
  showImage?: boolean;
};

export function CourseCard({ course, variant = "catalog", status, href, actions, meta, showImage = false }: Props) {
  const instructor = variant === "instructor";
  return (
    <li className="eb-card">
      {showImage ? (
        <img
          src={coursePlaceholder(course.category?.slug ?? course.id)}
          alt=""
          width={400}
          height={160}
          className="mb-3 h-28 w-full rounded-md object-cover"
        />
      ) : null}
      <div className="mb-2 flex flex-wrap gap-2 empty:hidden">
        {course.category ? <Badge>{course.category.name}</Badge> : null}
        {instructor && status ? <StatusBadge status={status} /> : null}
      </div>
      <h3 className="text-base leading-6 font-semibold">
        <Link href={href ?? `/cursos/${course.id}`}>{course.title}</Link>
      </h3>
      <p className="mt-1 line-clamp-3 text-sm text-fg-2">{course.description}</p>
      {instructor && meta ? <p className="mt-2 text-xs text-fg-3">{meta}</p> : null}
      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        {instructor ? (
          <>
            <Rating avg={course.rating_avg} count={course.rating_count} />
            <div className="flex gap-2">{actions}</div>
          </>
        ) : (
          <>
            {course.instructor ? (
              <Link href={`/instructores/${course.instructor.id}`} className="text-xs text-fg-2 hover:underline">
                {course.instructor.display_name}
              </Link>
            ) : (
              <span />
            )}
            <Rating avg={course.rating_avg} count={course.rating_count} />
          </>
        )}
      </div>
    </li>
  );
}

// Tarjeta de carga del sistema: mismas medidas que la real, solo pulso de opacidad.
export function CourseCardSkeleton() {
  return (
    <li className="eb-card eb-card--loading" aria-hidden="true">
      <span className="eb-skel mb-2 h-5 w-[72px] rounded-full" />
      <span className="eb-skel h-6 w-[70%]" />
      <span className="eb-skel mt-2 h-3.5 w-full" />
      <span className="eb-skel mt-1.5 h-3.5 w-[85%]" />
      <span className="eb-skel mt-1.5 h-3.5 w-[60%]" />
      <div className="mt-auto flex justify-between pt-3">
        <span className="eb-skel h-3 w-20" />
        <span className="eb-skel h-3 w-16" />
      </div>
    </li>
  );
}

// Rejilla de carga: mismas medidas que la lista real para evitar saltos de layout.
export function CourseGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="eb-grid" aria-busy="true" aria-label="Cargando cursos">
      {Array.from({ length: count }, (_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </ul>
  );
}
