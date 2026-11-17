import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { crearEscenario, type Escenario, type Usuario } from "../../tests/support/escenario";

// Criterios de openspec/specs/course-reviews/spec.md contra la base real.
// Cada accion se hace con la sesion del usuario que corresponde (RLS aplicada): el administrador
// (e.admin) solo se usa para LEER el estado de la base y comprobar el resultado.

let e: Escenario;

beforeEach(async () => {
  e = await crearEscenario();
});

afterEach(async () => {
  await e.limpiar();
});

/** Resenas guardadas del curso, leidas como administrador (sin RLS). */
async function resenasEnBd() {
  const { data, error } = await e.admin
    .from("reviews")
    .select("id, student_id, rating, comment")
    .eq("course_id", e.curso.id)
    .order("created_at");
  if (error) throw error;
  return data;
}

async function cursoEnBd() {
  const { data, error } = await e.admin
    .from("courses")
    .select("rating_avg, rating_count")
    .eq("id", e.curso.id)
    .single();
  if (error) throw error;
  return data;
}

/** Resena enviada por `autor` con su propia sesion. */
function resenar(autor: Usuario, rating: number, comment: string | null = null) {
  return autor.cliente
    .from("reviews")
    .insert({ course_id: e.curso.id, student_id: autor.id, rating, comment })
    .select("id")
    .maybeSingle();
}

describe("Requirement: Reseña de estudiantes inscritos", () => {
  it("Scenario: Estudiante inscrito reseña — se guarda y es visible en el curso", async () => {
    const { error } = await resenar(e.estudianteInscrito, 4, "Muy buen curso");
    expect(error).toBeNull();

    expect(await resenasEnBd()).toMatchObject([
      { student_id: e.estudianteInscrito.id, rating: 4, comment: "Muy buen curso" },
    ]);

    // Visible para el propio autor, con su sesion.
    const { data } = await e.estudianteInscrito.cliente.from("reviews").select("rating").eq("course_id", e.curso.id);
    expect(data).toEqual([{ rating: 4 }]);
  });

  it("Scenario: Estudiante no inscrito reseña — el sistema rechaza la reseña", async () => {
    const { error } = await resenar(e.estudianteSinInscribir, 4, "Sin estar inscrito");
    expect(error).not.toBeNull();
    expect(await resenasEnBd()).toHaveLength(0);
  });

  it.each([0, 6])("Scenario: Calificación fuera de rango (%i) — el sistema rechaza la reseña", async (rating) => {
    const { error } = await resenar(e.estudianteInscrito, rating);
    expect(error).not.toBeNull();
    expect(await resenasEnBd()).toHaveLength(0);
  });
});

describe("Requirement: Una reseña por estudiante y curso", () => {
  it("Scenario: Reseña duplicada — no se crea una segunda reseña", async () => {
    expect((await resenar(e.estudianteInscrito, 4, "Primera")).error).toBeNull();

    const { error } = await resenar(e.estudianteInscrito, 2, "Segunda");
    expect(error).not.toBeNull();

    expect(await resenasEnBd()).toMatchObject([{ rating: 4, comment: "Primera" }]);
  });

  it("Scenario: Autor edita su reseña — se guarda la versión actualizada", async () => {
    const { data: creada } = await resenar(e.estudianteInscrito, 3, "Regular");

    const { data, error } = await e.estudianteInscrito.cliente
      .from("reviews")
      .update({ rating: 5, comment: "Mejoro mucho" })
      .eq("id", creada!.id)
      .select("id");
    expect(error).toBeNull();
    expect(data).toHaveLength(1);

    expect(await resenasEnBd()).toMatchObject([{ rating: 5, comment: "Mejoro mucho" }]);
  });

  it("Requirement: el autor puede eliminar su reseña", async () => {
    const { data: creada } = await resenar(e.estudianteInscrito, 3);

    const { data, error } = await e.estudianteInscrito.cliente.from("reviews").delete().eq("id", creada!.id).select("id");
    expect(error).toBeNull();
    expect(data).toHaveLength(1);

    expect(await resenasEnBd()).toHaveLength(0);
  });

  it("Scenario: Otro usuario edita la reseña — el sistema lo rechaza", async () => {
    const { data: creada } = await resenar(e.estudianteInscrito, 4, "Original");

    // Ni otro estudiante ni el instructor del curso pueden modificarla.
    for (const intruso of [e.estudianteSinInscribir, e.instructor]) {
      const { data } = await intruso.cliente
        .from("reviews")
        .update({ rating: 1, comment: "Saboteada" })
        .eq("id", creada!.id)
        .select("id");
      expect(data ?? []).toHaveLength(0);
    }

    expect(await resenasEnBd()).toMatchObject([{ rating: 4, comment: "Original" }]);
  });

  it("Scenario: Otro usuario elimina la reseña — el sistema lo rechaza", async () => {
    const { data: creada } = await resenar(e.estudianteInscrito, 4, "Original");

    for (const intruso of [e.estudianteSinInscribir, e.instructor]) {
      const { data } = await intruso.cliente.from("reviews").delete().eq("id", creada!.id).select("id");
      expect(data ?? []).toHaveLength(0);
    }

    expect(await resenasEnBd()).toHaveLength(1);
  });
});

describe("Requirement: Instructor no reseña su propio curso", () => {
  it("Scenario: Autovaloración — el sistema rechaza la reseña", async () => {
    const { error } = await resenar(e.instructor, 5, "Mi curso es el mejor");
    expect(error).not.toBeNull();
    expect(await resenasEnBd()).toHaveLength(0);
  });
});

describe("Requirement: Reseñas públicas y promedio", () => {
  it("Reseñas de un curso publicado visibles para cualquier visitante", async () => {
    await resenar(e.estudianteInscrito, 4, "Visible para todos");

    const { data, error } = await e.anonimo.from("reviews").select("rating, comment").eq("course_id", e.curso.id);
    expect(error).toBeNull();
    expect(data).toEqual([{ rating: 4, comment: "Visible para todos" }]);
  });

  it("Scenario: Promedio calculado — calificaciones 5 y 3 dan 4,0 con 2 reseñas", async () => {
    // El segundo estudiante se inscribe por si mismo, con su sesion.
    const { error: errorInscripcion } = await e.estudianteSinInscribir.cliente
      .from("enrollments")
      .insert({ student_id: e.estudianteSinInscribir.id, course_id: e.curso.id });
    expect(errorInscripcion).toBeNull();

    expect((await resenar(e.estudianteInscrito, 5)).error).toBeNull();
    expect((await resenar(e.estudianteSinInscribir, 3)).error).toBeNull();

    // Lo que ve un visitante en el catalogo y el detalle.
    const { data } = await e.anonimo
      .from("courses")
      .select("rating_avg, rating_count")
      .eq("id", e.curso.id)
      .single();
    expect(Number(data!.rating_avg)).toBe(4);
    expect(data!.rating_count).toBe(2);
  });

  it("Scenario: Curso sin reseñas — el catálogo indica que aún no tiene valoraciones", async () => {
    const { data } = await e.anonimo
      .from("courses")
      .select("rating_avg, rating_count")
      .eq("id", e.curso.id)
      .single();
    expect(data!.rating_count).toBe(0);
    expect(await cursoEnBd()).toMatchObject({ rating_count: 0 });
  });
});
