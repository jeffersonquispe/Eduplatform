import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { crearEscenario, type Escenario, type Usuario } from "../../tests/support/escenario";

// Criterios de integracion de openspec/specs/course-enrollment/spec.md contra la base real.
// Cada accion usa la sesion del usuario que corresponde; el administrador (e.admin) solo LEE para comprobar.

let e: Escenario;

beforeEach(async () => {
  e = await crearEscenario();
});

afterEach(async () => {
  await e.limpiar();
});

function inscribir(u: Usuario) {
  return u.cliente.from("enrollments").insert({ student_id: u.id, course_id: e.curso.id });
}

/** Inscripciones del estudiante en el curso, leidas como administrador. */
async function inscripcionesEnBd(u: Usuario) {
  const { data, error } = await e.admin
    .from("enrollments")
    .select("id")
    .eq("course_id", e.curso.id)
    .eq("student_id", u.id);
  if (error) throw error;
  return data;
}

/** Contenido de la leccion pedido directo a la API de datos (REST), como quien se salta la pagina. */
async function contenidoPorApi(u: Usuario | null): Promise<{ body: string }[]> {
  const token = u ? (await u.cliente.auth.getSession()).data.session!.access_token : e.api.anonKey;
  const res = await fetch(`${e.api.url}/rest/v1/lesson_contents?select=body&lesson_id=eq.${e.curso.leccionId}`, {
    headers: { apikey: e.api.anonKey, Authorization: `Bearer ${token}` },
  });
  const cuerpo = await res.json();
  return Array.isArray(cuerpo) ? cuerpo : [];
}

describe("Requirement: Inscripción gratuita de estudiantes", () => {
  it("Scenario: Inscripción exitosa — existe su inscripción y puede ver el contenido", async () => {
    const estudiante = e.estudianteSinInscribir;
    expect(await contenidoPorApi(estudiante)).toHaveLength(0);

    const { error } = await inscribir(estudiante);
    expect(error).toBeNull();

    expect(await inscripcionesEnBd(estudiante)).toHaveLength(1);
    expect(await contenidoPorApi(estudiante)).toEqual([{ body: e.curso.contenido }]);
  });

  it("Scenario: Inscripción duplicada — no se crea una segunda inscripción", async () => {
    const estudiante = e.estudianteInscrito;
    expect(await inscripcionesEnBd(estudiante)).toHaveLength(1);

    const { error } = await inscribir(estudiante);
    expect(error).not.toBeNull();

    expect(await inscripcionesEnBd(estudiante)).toHaveLength(1);
  });
});

describe("Requirement: Contenido de lecciones solo para inscritos", () => {
  it("Scenario: Usuario no inscrito consulta el contenido llamando directo a la API — no lo recibe", async () => {
    // Estudiante con sesion pero sin inscribir, y visitante sin sesion.
    for (const quien of [e.estudianteSinInscribir, null]) {
      expect(await contenidoPorApi(quien)).toHaveLength(0);
    }
    // Y tampoco por el cliente, con su propia sesion.
    const { data } = await e.estudianteSinInscribir.cliente.from("lesson_contents").select("body");
    expect(data ?? []).toHaveLength(0);
  });
});

describe("Requirement: Cancelar inscripción", () => {
  it("Scenario: Cancelación — deja de ver el contenido de las lecciones", async () => {
    const estudiante = e.estudianteInscrito;
    expect(await contenidoPorApi(estudiante)).toHaveLength(1);

    const { error } = await estudiante.cliente.from("enrollments").delete().eq("course_id", e.curso.id);
    expect(error).toBeNull();

    expect(await inscripcionesEnBd(estudiante)).toHaveLength(0);
    expect(await contenidoPorApi(estudiante)).toHaveLength(0);
  });
});
