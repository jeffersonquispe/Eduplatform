// Logica pura de resenas y calificaciones: recibe datos ya cargados, sin red ni Supabase.
// El promedio de cada curso (courses.rating_avg/rating_count) lo mantienen triggers en la BD;
// aqui solo se valida la entrada y se formatea/agrega lo que ya viene cargado.

export const RATING_MIN = 1;
export const RATING_MAX = 5;
export const COMMENT_MAX_LENGTH = 2000;

/** Devuelve el mensaje de error, o null si la resena es valida. */
export function validateReview(rating: number, comment: string | null): string | null {
  if (!Number.isInteger(rating) || rating < RATING_MIN || rating > RATING_MAX) {
    return "La calificacion debe ser un numero entero de 1 a 5.";
  }
  if (comment && comment.length > COMMENT_MAX_LENGTH) {
    return "El comentario no puede superar 2000 caracteres.";
  }
  return null;
}

/** Promedio con un decimal en formato es (p. ej. "4,5"). */
export function formatRatingAvg(avg: number | string): string {
  return Number(avg).toLocaleString("es", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function reviewCountLabel(count: number): string {
  return count === 1 ? "resena" : "resenas";
}

/** Media de las valoraciones de los cursos que ya tienen alguna; null si ninguno. */
export function averageOfRatedCourses(courses: { rating_avg: number | string; rating_count: number }[]): number | null {
  const rated = courses.filter((c) => c.rating_count > 0);
  if (!rated.length) return null;
  return rated.reduce((sum, c) => sum + Number(c.rating_avg), 0) / rated.length;
}
