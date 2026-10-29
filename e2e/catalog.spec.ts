import { expect, test } from "@playwright/test";

const SEO = "c1c1c1c1-e2e0-0000-0000-000000000001";
const DRAFT = "d4d4d4d4-e2e0-0000-0000-000000000004";

test("el catalogo muestra solo cursos publicados", async ({ page }) => {
  await page.goto("/cursos");
  await expect(page.getByRole("link", { name: "SEO practico para negocios" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Agentes de IA para ventas" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Fundamentos de prompting" })).toBeVisible();
  await expect(page.getByText("Borrador oculto")).toHaveCount(0);
});

test("cada tarjeta muestra instructor, categoria y estado de valoracion", async ({ page }) => {
  await page.goto("/cursos");
  const card = page.getByRole("listitem").filter({ hasText: "SEO practico para negocios" });
  await expect(card.getByRole("link", { name: "Ana Instructora" })).toBeVisible();
  await expect(card.getByText("Marketing digital")).toBeVisible();
  await expect(card.getByText("Aun sin valoraciones")).toBeVisible();
});

test("filtrar por categoria muestra solo cursos de esa categoria", async ({ page }) => {
  await page.goto("/cursos");
  await page.getByRole("navigation", { name: "Categorias" }).getByRole("link", { name: "Inteligencia artificial" }).click();
  await expect(page).toHaveURL(/categoria=inteligencia-artificial/);
  await expect(page.getByRole("link", { name: "Fundamentos de prompting" })).toBeVisible();
  await expect(page.getByRole("link", { name: "SEO practico para negocios" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Agentes de IA para ventas" })).toHaveCount(0);
});

test("busqueda con resultados", async ({ page }) => {
  await page.goto("/cursos");
  await page.getByRole("searchbox", { name: "Buscar cursos" }).fill("posicionamiento");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page).toHaveURL(/q=posicionamiento/);
  await expect(page.getByRole("link", { name: "SEO practico para negocios" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Fundamentos de prompting" })).toHaveCount(0);
});

test("busqueda sin resultados muestra un estado vacio", async ({ page }) => {
  await page.goto("/cursos?q=cocina");
  await expect(page.getByText("No encontramos cursos con esos criterios.")).toBeVisible();
});

test("la busqueda no encuentra borradores", async ({ page }) => {
  await page.goto("/cursos?q=Borrador");
  await expect(page.getByText("No encontramos cursos con esos criterios.")).toBeVisible();
});

test("el detalle muestra descripcion y temario pero no el contenido de las lecciones", async ({ page }) => {
  await page.goto(`/cursos/${SEO}`);
  await expect(page.getByRole("heading", { name: "SEO practico para negocios", level: 1 })).toBeVisible();
  await expect(page.getByText("Aprende posicionamiento web paso a paso")).toBeVisible();

  const temario = page.getByRole("region", { name: /Temario/ });
  await expect(temario.getByRole("heading", { name: "Fundamentos" })).toBeVisible();
  await expect(temario.getByRole("heading", { name: "Tecnico" })).toBeVisible();
  await expect(temario.getByText("Que es el SEO")).toBeVisible();
  await expect(temario.getByText("SEO tecnico")).toBeVisible();

  const html = await page.content();
  expect(html).not.toContain("CONTENIDO-SECRETO");
  expect(html).not.toContain("example.com/video");
  await expect(page.getByText("Este curso aun no tiene valoraciones.")).toBeVisible();
});

test("un curso en borrador o inexistente se muestra como no encontrado", async ({ page }) => {
  await page.goto(`/cursos/${DRAFT}`);
  await expect(page.getByRole("heading", { name: "Pagina no encontrada" })).toBeVisible();
  await expect(page.getByText("Borrador oculto")).toHaveCount(0);

  await page.goto("/cursos/00000000-0000-0000-0000-000000000000");
  await expect(page.getByRole("heading", { name: "Pagina no encontrada" })).toBeVisible();
});
