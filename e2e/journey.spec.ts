import { expect, test, type Page } from "@playwright/test";
import { AUTH_STATE } from "./auth-state";

// Recorrido encadenado de tres personas sobre un mismo curso:
//   1. Visitante: botón del asistente (assistant-widget).
//   2. Instructor: crea, intenta publicar sin lecciones, agrega una y publica (course-management).
//   3. Estudiante: busca el curso, se inscribe y lo ve en su panel (course-enrollment).
// Cada rol usa su propia sesión guardada por auth.setup.ts. No se prueba el modo voz.

const EDY = "http://edy.test";

// Página mínima que hace de asistente: responde al saludo para que el panel dé la carga por buena.
const STUB_WIDGET = `<!doctype html><html lang="es"><body><label>Mensaje <input /></label>
<script>
  addEventListener("message", (e) => {
    if (e.data.type === "edy:init") parent.postMessage({ type: "edy:ready" }, e.origin);
  });
</script></body></html>`;

// E2E_RECORD=1 graba un video por rol y una captura al final de cada paso, en test-results/ (y adjuntas al reporte).
// Los contextos se crean a mano, por eso el video se pide aqui y no en la config.
const RECORD = process.env.E2E_RECORD === "1";
const recordVideo = (role: string) => (RECORD ? { dir: test.info().outputPath(`video-${role}`) } : undefined);

async function shot(page: Page, name: string) {
  if (!RECORD) return;
  const path = test.info().outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await test.info().attach(name, { path, contentType: "image/png" });
}

const courseCard = (page: Page, title: string) => page.getByTestId("course-card").filter({ hasText: title });

test("visitante, instructor y estudiante recorren un curso de principio a fin", async ({ browser }) => {
  const title = `E2E Recorrido ${Date.now()}`;
  const visitor = await browser.newContext({ recordVideo: recordVideo("visitante") });
  const instructor = await browser.newContext({ storageState: AUTH_STATE.instructor, recordVideo: recordVideo("instructor") });
  const student = await browser.newContext({ storageState: AUTH_STATE.student, recordVideo: recordVideo("estudiante") });
  const instructorPage = await instructor.newPage();
  let courseUrl: string | undefined;

  try {
    await test.step("Visitante: ve el botón del asistente y lo abre y cierra", async () => {
      const page = await visitor.newPage();
      const edyRequests: string[] = [];
      await page.route(`${EDY}/**`, (route) => {
        edyRequests.push(route.request().url());
        return route.fulfill({ contentType: "text/html", body: STUB_WIDGET });
      });

      await page.goto("/cursos");
      const launcher = page.getByRole("button", { name: "Asistente", exact: true });
      await expect(launcher).toBeVisible();
      expect(edyRequests, "Edy no recibe peticiones hasta abrir el panel").toEqual([]);

      await launcher.click();
      const panel = page.getByRole("dialog", { name: "Asistente" });
      await expect(panel).toBeVisible();
      await expect(page.getByTitle("Asistente de cursos EduTech")).toBeVisible();

      await page.getByRole("button", { name: "Cerrar asistente" }).click();
      await expect(panel).toBeHidden();
      await expect(launcher).toBeFocused();
      await shot(page, "1-visitante-asistente");
      await page.close();
    });

    await test.step("Instructor: crea un curso, no puede publicarlo sin lecciones, agrega una y lo publica", async () => {
      const page = instructorPage;
      await page.goto("/instructor");
      await page.getByRole("link", { name: "Nuevo curso" }).click();
      await page.getByLabel("Titulo").fill(title);
      await page.getByLabel("Descripcion").fill("Curso creado por la prueba de recorrido completo");
      await page.getByLabel("Categoria").selectOption({ label: "Marketing digital" });
      await page.getByRole("button", { name: "Crear curso" }).click();
      await expect(page).toHaveURL(/\/instructor\/cursos\/[0-9a-f-]{36}$/);
      courseUrl = page.url();
      await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
      await expect(page.getByText("Borrador", { exact: true }).first()).toBeVisible();

      await page.getByRole("button", { name: "Publicar curso" }).click();
      await expect(page.getByRole("alert").filter({ hasText: "al menos una leccion" })).toBeVisible();

      await page.getByRole("textbox", { name: "Titulo de la nueva seccion" }).fill("Introduccion");
      await page.getByRole("button", { name: "Agregar seccion" }).click();
      const section = page.getByTestId("section").first();
      await expect(section.getByLabel("Titulo de la seccion Introduccion")).toBeVisible();

      await section.locator("summary", { hasText: "Agregar leccion" }).click();
      await section.getByLabel("Titulo de la leccion").fill("Primera leccion");
      await section.getByLabel("Contenido").fill("Contenido de la primera leccion");
      await section.getByRole("button", { name: "Agregar leccion" }).click();
      await expect(section.getByTestId("lesson").filter({ hasText: "Primera leccion" })).toBeVisible();

      await page.getByRole("button", { name: "Publicar curso" }).click();
      await expect(page.getByText("Curso publicado.")).toBeVisible();
      await shot(page, "2-instructor-curso-publicado");
    });

    await test.step("Estudiante: busca el curso, se inscribe y lo ve en Mis cursos", async () => {
      const page = await student.newPage();
      await page.goto("/cursos");
      await page.getByRole("searchbox", { name: "Buscar cursos" }).fill(title);
      await page.getByRole("button", { name: "Buscar" }).click();
      await expect(page).toHaveURL(/\/cursos\?.*q=/);

      await courseCard(page, title).getByRole("link", { name: title }).click();
      await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
      await page.getByRole("button", { name: "Inscribirme gratis" }).click();
      await expect(page).toHaveURL(/\/aprender\/[0-9a-f-]{36}\/[0-9a-f-]{36}$/);
      await expect(page.getByRole("heading", { name: "Primera leccion", level: 1 })).toBeVisible();
      await expect(page.getByText("Contenido de la primera leccion")).toBeVisible();

      await page.goto("/mis-cursos");
      await expect(courseCard(page, title)).toBeVisible();
      await expect(courseCard(page, title).getByRole("link", { name: "Continuar aprendiendo" })).toBeVisible();
      await shot(page, "3-estudiante-mis-cursos");
    });
  } finally {
    // Limpieza: borrar el curso (las inscripciones y lecciones caen en cascada).
    if (courseUrl) {
      instructorPage.on("dialog", (d) => d.accept());
      await instructorPage.goto(courseUrl);
      await instructorPage.getByRole("button", { name: "Eliminar curso" }).click();
      await expect(instructorPage).toHaveURL(/\/instructor$/);
    }
    await Promise.all([visitor.close(), instructor.close(), student.close()]);
  }
});
