// Ayuda para pruebas de integracion contra el proyecto Supabase en la nube (el mismo de los e2e).
// Con la clave de administrador (service_role) prepara un instructor, un curso publicado suyo,
// un estudiante inscrito y otro sin inscribir, cada uno con su propia sesion (cliente con su JWT,
// por lo que RLS se aplica igual que en la app). `limpiar()` borra todo lo creado.
//
// Va fuera de src/ a proposito: la service_role nunca debe llegar al codigo de la app.
//
// Variables (se leen de .env.test.local, que esta en .gitignore; ver vitest.config.mts):
//   SUPABASE_TEST_URL               https://<ref>.supabase.co
//   SUPABASE_TEST_ANON_KEY          clave anon
//   SUPABASE_TEST_SERVICE_ROLE_KEY  clave secreta (`npx supabase projects api-keys --reveal`)
//   SUPABASE_TEST_ALLOW_REMOTE=1    confirmacion explicita para usar un proyecto que no es local
//
// Uso:
//   let e: Escenario;
//   beforeEach(async () => { e = await crearEscenario(); });
//   afterEach(async () => { await e.limpiar(); });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/database.types";

export type Cliente = SupabaseClient<Database>;

export type Usuario = {
  id: string;
  email: string;
  /** Sesion propia: consultas con el JWT de este usuario (RLS aplicada). */
  cliente: Cliente;
};

export type Escenario = {
  /** Administrador: se salta RLS. Solo para preparar y comprobar datos. */
  admin: Cliente;
  /** Visitante sin sesion (rol anon). */
  anonimo: Cliente;
  instructor: Usuario;
  estudianteInscrito: Usuario;
  estudianteSinInscribir: Usuario;
  /** Curso publicado del instructor, con una seccion y una leccion que tiene contenido. */
  curso: { id: string; seccionId: string; leccionId: string; contenido: string };
  /** Datos para llamar a la API de datos (PostgREST) directamente, saltandose la app. */
  api: { url: string; anonKey: string };
  /** Borra usuarios (y en cascada perfiles, cursos, inscripciones y resenas). Se puede llamar varias veces. */
  limpiar: () => Promise<void>;
};

// Mismo dominio que las cuentas de e2e-fixtures.sql, para que e2e-cleanup.sql tambien las retire.
const DOMINIO = "@e2e-test.local";
const PASSWORD = "E2e-Passw0rd!";
const CONTENIDO = "CONTENIDO-SECRETO-Que es el SEO";

function config() {
  const url = process.env.SUPABASE_TEST_URL;
  const anon = process.env.SUPABASE_TEST_ANON_KEY;
  const service = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) {
    throw new Error("Faltan SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY y SUPABASE_TEST_SERVICE_ROLE_KEY (.env.test.local).");
  }
  // Con la clave de administrador hay que decidir a conciencia contra que base se corre.
  const host = new URL(url).hostname;
  const local = host === "127.0.0.1" || host === "localhost";
  if (!local && process.env.SUPABASE_TEST_ALLOW_REMOTE !== "1") {
    throw new Error(`${host} no es local: define SUPABASE_TEST_ALLOW_REMOTE=1 para confirmar que quieres usarlo.`);
  }
  return { url, anon, service };
}

function sinSesionPersistente() {
  return {
    auth: { persistSession: false, autoRefreshToken: false },
    // Estas pruebas no usan Realtime; el stub evita el error en Node < 22, que no trae WebSocket nativo.
    realtime: { transport: class {} as never },
  };
}

export async function crearEscenario(): Promise<Escenario> {
  const { url, anon, service } = config();
  const admin = createClient<Database>(url, service, sinSesionPersistente());
  const anonimo = createClient<Database>(url, anon, sinSesionPersistente());

  // Sufijo unico por escenario: las pruebas no chocan entre si ni con e2e-fixtures.sql.
  const sufijo = crypto.randomUUID().slice(0, 8);
  const ids: string[] = [];

  const limpiar = async () => {
    // Borrar el usuario arrastra su perfil, cursos, inscripciones y resenas (on delete cascade).
    const pendientes = ids.splice(0);
    for (const id of pendientes) {
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) throw new Error(`No se pudo borrar el usuario ${id}: ${error.message}`);
    }
  };

  async function crearUsuario(rol: "instructor" | "student", nombre: string, clave: string): Promise<Usuario> {
    const email = `${clave}-${sufijo}${DOMINIO}`;
    // El rol llega por metadatos de registro; un trigger crea el perfil.
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { role: rol, display_name: nombre },
    });
    if (error || !data.user) throw new Error(`No se pudo crear ${email}: ${error?.message}`);
    ids.push(data.user.id);

    const cliente = createClient<Database>(url, anon, sinSesionPersistente());
    const { error: errorSesion } = await cliente.auth.signInWithPassword({ email, password: PASSWORD });
    if (errorSesion) throw new Error(`No se pudo iniciar sesion como ${email}: ${errorSesion.message}`);
    return { id: data.user.id, email, cliente };
  }

  try {
    const instructor = await crearUsuario("instructor", "Ana Instructora", "instructor");
    const estudianteInscrito = await crearUsuario("student", "Sofia Estudiante", "inscrito");
    const estudianteSinInscribir = await crearUsuario("student", "Luis Estudiante", "sin-inscribir");

    const { data: categoria, error: errorCategoria } = await admin
      .from("categories")
      .select("id")
      .eq("slug", "marketing-digital")
      .single();
    if (errorCategoria) throw new Error(`Categoria no encontrada: ${errorCategoria.message}`);

    // Se crea en borrador y se publica al final para pasar la validacion de publicacion.
    const { data: curso, error: errorCurso } = await admin
      .from("courses")
      .insert({
        instructor_id: instructor.id,
        category_id: categoria.id,
        title: "SEO practico para negocios",
        description: "Aprende posicionamiento web paso a paso con casos reales.",
      })
      .select("id")
      .single();
    if (errorCurso) throw new Error(`No se pudo crear el curso: ${errorCurso.message}`);

    const { data: seccion, error: errorSeccion } = await admin
      .from("sections")
      .insert({ course_id: curso.id, title: "Fundamentos", position: 1 })
      .select("id")
      .single();
    if (errorSeccion) throw new Error(`No se pudo crear la seccion: ${errorSeccion.message}`);

    const { data: leccion, error: errorLeccion } = await admin
      .from("lessons")
      .insert({ section_id: seccion.id, title: "Que es el SEO", position: 1 })
      .select("id")
      .single();
    if (errorLeccion) throw new Error(`No se pudo crear la leccion: ${errorLeccion.message}`);

    const { error: errorContenido } = await admin
      .from("lesson_contents")
      .insert({ lesson_id: leccion.id, body: CONTENIDO, video_url: "https://example.com/video/1" });
    if (errorContenido) throw new Error(`No se pudo crear el contenido: ${errorContenido.message}`);

    const { error: errorPublicar } = await admin.from("courses").update({ status: "published" }).eq("id", curso.id);
    if (errorPublicar) throw new Error(`No se pudo publicar el curso: ${errorPublicar.message}`);

    const { error: errorInscripcion } = await admin
      .from("enrollments")
      .insert({ student_id: estudianteInscrito.id, course_id: curso.id });
    if (errorInscripcion) throw new Error(`No se pudo inscribir al estudiante: ${errorInscripcion.message}`);

    return {
      admin,
      anonimo,
      instructor,
      estudianteInscrito,
      estudianteSinInscribir,
      curso: { id: curso.id, seccionId: seccion.id, leccionId: leccion.id, contenido: CONTENIDO },
      api: { url, anonKey: anon },
      limpiar,
    };
  } catch (error) {
    // Si la preparacion falla a medias, no dejar usuarios huerfanos.
    await limpiar();
    throw error;
  }
}
