import { describe, expect, it } from "vitest";
import { formatRatingAvg, reviewCountLabel, validateReview } from "@/lib/reviews";

// Criterios de openspec/specs/course-reviews/spec.md que se pueden comprobar sin BD ni red.
// (Inscripcion, reseña unica, autoria y autovaloracion se aplican con RLS: ver supabase/tests/rls.sql.)

describe("Requirement: Reseña de estudiantes inscritos", () => {
  describe("Scenario: Estudiante inscrito reseña", () => {
    it("acepta una calificacion de 4 con comentario", () => {
      expect(validateReview(4, "Muy buen curso")).toBeNull();
    });
  });

  describe("Scenario: Calificación fuera de rango", () => {
    it.each([0, -1, 6, 100])("rechaza la calificacion %i", (rating) => {
      expect(validateReview(rating, null)).not.toBeNull();
    });

    it.each([1, 5])("acepta el limite %i", (rating) => {
      expect(validateReview(rating, null)).toBeNull();
    });
  });

  describe("Requirement: calificación entera", () => {
    it.each([3.5, 4.2, NaN, Infinity])("rechaza la calificacion no entera %s", (rating) => {
      expect(validateReview(rating, null)).not.toBeNull();
    });
  });

  describe("Requirement: comentario opcional", () => {
    it("acepta una resena sin comentario", () => {
      expect(validateReview(5, null)).toBeNull();
    });
  });
});

describe("Requirement: Reseñas públicas y promedio", () => {
  describe("Scenario: Promedio calculado", () => {
    it("muestra 4,0 con 2 reseñas para un curso con calificaciones 5 y 3", () => {
      const avg = (5 + 3) / 2;
      expect(formatRatingAvg(avg)).toBe("4,0");
      expect(`2 ${reviewCountLabel(2)}`).toBe("2 resenas");
    });

    it("acepta el promedio como cadena (numeric de Postgres)", () => {
      expect(formatRatingAvg("4.00")).toBe("4,0");
    });

    it("usa el singular con una sola resena", () => {
      expect(reviewCountLabel(1)).toBe("resena");
    });
  });
});
