import { expect, test } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

const FOREIGN_COURSE = "c3c3c3c3-e2e0-0000-0000-000000000003"; // de instructor B
const OWN_PUBLISHED = "c1c1c1c1-e2e0-0000-0000-000000000001"; // de instructor A

test("el panel muestra solo los cursos propios con su estado", async ({ page }) => {
  await login(page, ACCOUNTS.instructorA);
  await expect(page).toHaveURL(/\/instructor$/);

  await expect(page.getByRole("link", { name: "SEO practico para negocios" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Agentes de IA para ventas" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Borrador oculto" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Fundamentos de prompting" })).toHaveCount(0);

  const draft = page.getByRole("listitem").filter({ hasText: "Borrador oculto" });
  await expect(draft.getByText("Borrador", { exact: true })).toBeVisible();
  const published = page.getByRole("listitem").filter({ hasText: "SEO practico para negocios" });
  await expect(published.getByText("Publicado")).toBeVisible();
  await expect(published.getByText("0 inscritos")).toBeVisible();
});

test("otro instructor solo ve sus propios cursos", async ({ page }) => {
  await login(page, ACCOUNTS.instructorB);
  await expect(page).toHaveURL(/\/instructor$/);
  await expect(page.getByRole("link", { name: "Fundamentos de prompting" })).toBeVisible();
  await expect(page.getByRole("link", { name: "SEO practico para negocios" })).toHaveCount(0);
});

test("un instructor no puede abrir el editor del curso de otro", async ({ page }) => {
  await login(page, ACCOUNTS.instructorA);
  await expect(page).toHaveURL(/\/instructor$/);
  await page.goto(`/instructor/cursos/${FOREIGN_COURSE}`);
  await expect(page.getByRole("heading", { name: "Pagina no encontrada" })).toBeVisible();
  await expect(page.getByText("Fundamentos de prompting")).toHaveCount(0);
});

test("un estudiante no puede crear cursos", async ({ page }) => {
  await login(page, ACCOUNTS.student1);
  await expect(page).toHaveURL(/\/mis-cursos$/);
  await page.goto("/instructor/cursos/nuevo");
  await expect(page).toHaveURL(/\/$/);
  await page.goto(`/instructor/cursos/${OWN_PUBLISHED}`);
  await expect(page).toHaveURL(/\/$/);
});

test("ciclo completo: crear, estructurar, reordenar, publicar, despublicar y eliminar", async ({ page }) => {
  const TITLE = `E2E Curso ${Date.now()}`;
  page.on("dialog", (d) => d.accept());
  await login(page, ACCOUNTS.instructorA);
  await expect(page).toHaveURL(/\/instructor$/);

  // Crear
  await page.getByRole("link", { name: "Nuevo curso" }).click();
  await page.getByLabel("Titulo").fill(TITLE);
  await page.getByLabel("Descripcion").fill("Descripcion del curso de prueba");
  await page.getByLabel("Categoria").selectOption({ label: "Marketing digital" });
  await page.getByRole("button", { name: "Crear curso" }).click();
  await expect(page).toHaveURL(/\/instructor\/cursos\/[0-9a-f-]{36}$/);
  const courseUrl = page.url();
  await expect(page.getByRole("heading", { name: TITLE, level: 1 })).toBeVisible();
  await expect(page.getByText("Borrador", { exact: true }).first()).toBeVisible();

  // Publicar sin lecciones se rechaza e indica que falta
  await page.getByRole("button", { name: "Publicar curso" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("al menos una leccion");

  // Seccion
  await page.getByLabel("Titulo de la nueva seccion").fill("Introduccion");
  await page.getByRole("button", { name: "Agregar seccion" }).click();
  const section = page.getByTestId("section").first();
  await expect(section.getByLabel("Titulo de la seccion Introduccion")).toBeVisible();

  // Dos lecciones
  for (const [title, body] of [
    ["Leccion uno", "Contenido uno"],
    ["Leccion dos", "Contenido dos"],
  ]) {
    const add = section.locator("details").filter({ has: page.locator("summary", { hasText: "Agregar leccion" }) });
    await add.evaluate((el: HTMLDetailsElement) => {
      el.open = true;
    });
    await add.getByLabel("Titulo de la leccion").fill(title);
    await add.getByLabel("Contenido").fill(body);
    await add.getByLabel("Enlace de video (opcional)").fill("https://example.com/video");
    await add.getByRole("button", { name: "Agregar leccion" }).click();
    await expect(section.getByTestId("lesson").filter({ hasText: title })).toBeVisible();
  }
  const lessons = section.getByTestId("lesson");
  await expect(lessons.nth(0)).toContainText("Leccion uno");
  await expect(lessons.nth(1)).toContainText("Leccion dos");

  // Reordenar: la segunda sube
  await lessons.nth(1).getByText("Leccion dos").click();
  await lessons.nth(1).getByRole("button", { name: "Subir leccion" }).click();
  await expect(lessons.nth(0)).toContainText("Leccion dos");
  await expect(lessons.nth(1)).toContainText("Leccion uno");

  // Editar una leccion
  await lessons.nth(1).getByText("Leccion uno").click();
  await lessons.nth(1).getByLabel("Titulo", { exact: true }).fill("Leccion uno editada");
  await lessons.nth(1).getByRole("button", { name: "Guardar leccion" }).click();
  await expect(lessons.nth(1).getByText("Leccion actualizada.")).toBeVisible();
  await expect(lessons.nth(1)).toContainText("Leccion uno editada");

  // Publicar y ver en el catalogo
  await page.getByRole("button", { name: "Publicar curso" }).click();
  await expect(page.getByText("Curso publicado.")).toBeVisible();
  await page.goto("/cursos");
  await expect(page.getByRole("link", { name: TITLE })).toBeVisible();

  // Despublicar: sale del catalogo
  await page.goto(courseUrl);
  await page.getByRole("button", { name: "Despublicar" }).click();
  await expect(page.getByText("Curso despublicado.")).toBeVisible();
  await page.goto("/cursos");
  await expect(page.getByRole("link", { name: TITLE })).toHaveCount(0);

  // Eliminar una leccion y luego el curso
  await page.goto(courseUrl);
  await page.getByTestId("lesson").first().getByText("Leccion dos").click();
  await page.getByTestId("lesson").first().getByRole("button", { name: "Eliminar leccion" }).click();
  await expect(page.getByTestId("lesson")).toHaveCount(1);

  await page.getByRole("button", { name: "Eliminar curso" }).click();
  await expect(page).toHaveURL(/\/instructor$/);
  await expect(page.getByRole("link", { name: TITLE })).toHaveCount(0);
});
