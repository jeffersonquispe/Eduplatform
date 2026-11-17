import { describe, expect, it } from "vitest";
import { decideEnrollment } from "@/lib/enrollment";

// Criterios unitarios de openspec/specs/course-enrollment/spec.md (funcion pura, sin red).

const estudiante = { role: "student" };
const publicado = { status: "published" };

describe("Requirement: Inscripción gratuita de estudiantes", () => {
  it("Scenario: Visitante anónimo intenta inscribirse — pedir inicio de sesión o registro", () => {
    expect(decideEnrollment({ user: null, course: publicado, alreadyEnrolled: false })).toBe("require-login");
  });

  it("Scenario: Inscripción exitosa — estudiante con sesión y curso publicado: inscribir", () => {
    expect(decideEnrollment({ user: estudiante, course: publicado, alreadyEnrolled: false })).toBe("enroll");
  });

  it("Scenario: Inscripción duplicada — estudiante ya inscrito: ya inscrito, sin crear otra", () => {
    expect(decideEnrollment({ user: estudiante, course: publicado, alreadyEnrolled: true })).toBe("already-enrolled");
  });

  it("Scenario: Curso no publicado — curso en borrador: rechazar", () => {
    expect(decideEnrollment({ user: estudiante, course: { status: "draft" }, alreadyEnrolled: false })).toBe("reject");
  });
});
