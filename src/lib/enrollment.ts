// Decision pura de inscripcion: recibe el estado ya cargado de la persona y del curso, sin red ni Supabase.
// La accion de servidor (app/actions/enrollments.ts) la llama y escribe en la BD segun el resultado.
// La autorizacion real sigue en RLS: esto solo da mensajes claros y evita llamadas inutiles.

export type EnrollmentDecision =
  | "require-login" // visitante sin sesion: pedir inicio de sesion o registro
  | "enroll" // crear la inscripcion
  | "already-enrolled" // ya inscrito: no crear otra
  | "reject"; // curso no publicado (o inexistente / no visible) o usuario que no es estudiante

export type EnrollmentInput = {
  /** null = visitante sin sesion. */
  user: { role: string } | null;
  /** null = el curso no existe o no es visible para esta persona. */
  course: { status: string } | null;
  alreadyEnrolled: boolean;
};

export function decideEnrollment({ user, course, alreadyEnrolled }: EnrollmentInput): EnrollmentDecision {
  if (!user) return "require-login";
  if (user.role !== "student") return "reject";
  if (!course || course.status !== "published") return "reject";
  if (alreadyEnrolled) return "already-enrolled";
  return "enroll";
}
