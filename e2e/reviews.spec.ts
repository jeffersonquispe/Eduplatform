import { expect, test } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

const SEO = "c1c1c1c1-e2e0-0000-0000-000000000001"; // publicado, de instructor A

test.describe.configure({ mode: "serial" });

async function enrollAndOpen(page: import("@playwright/test").Page, email: string) {
  await login(page, email);
  await expect(page).toHaveURL(/\/mis-cursos$/);
  await page.goto(`/cursos/${SEO}`);
  const enrollButton = page.getByRole("button", { name: "Inscribirme gratis" });
  // La pagina se transmite por partes: esperar a que aparezca uno de los dos estados antes de decidir.
  await expect(enrollButton.or(page.getByRole("link", { name: "Ir al curso" }))).toBeVisible();
  if (await enrollButton.isVisible()) {
    await enrollButton.click();
    await expect(page).toHaveURL(new RegExp(`/aprender/${SEO}/`));
    await page.goto(`/cursos/${SEO}`);
  }
}

test("quien no esta inscrito no ve el formulario de resena", async ({ page }) => {
  await login(page, ACCOUNTS.student1);
  await expect(page).toHaveURL(/\/mis-cursos$/);
  await page.goto(`/cursos/${SEO}`);
  await expect(page.getByText("Deja tu resena")).toHaveCount(0);
  await expect(page.getByText("Este curso aun no tiene valoraciones.")).toBeVisible();
});

test("un visitante anonimo y un instructor tampoco ven el formulario", async ({ page, browser }) => {
  await page.goto(`/cursos/${SEO}`);
  await expect(page.getByText("Deja tu resena")).toHaveCount(0);

  const instructor = await (await browser.newContext()).newPage();
  await login(instructor, ACCOUNTS.instructorA);
  await expect(instructor).toHaveURL(/\/instructor$/);
  await instructor.goto(`/cursos/${SEO}`);
  await expect(instructor.getByText("Deja tu resena")).toHaveCount(0);
});

test("un estudiante inscrito publica una resena", async ({ page }) => {
  await enrollAndOpen(page, ACCOUNTS.student1);
  await page.getByLabel("Calificacion").selectOption("5");
  await page.getByLabel("Comentario (opcional)").fill("Excelente curso");
  await page.getByRole("button", { name: "Publicar resena" }).click();

  await expect(page.getByRole("heading", { name: "Tu resena", exact: true })).toBeVisible();
  const list = page.getByRole("region", { name: "Resenas" });
  await expect(list.getByRole("listitem").filter({ hasText: "Excelente curso" })).toBeVisible();
});

test("el segundo estudiante reseña y el promedio de 5 y 3 es 4,0 con 2 resenas", async ({ page }) => {
  await enrollAndOpen(page, ACCOUNTS.student2);
  await page.getByLabel("Calificacion").selectOption("3");
  await page.getByLabel("Comentario (opcional)").fill("Util pero basico");
  await page.getByRole("button", { name: "Publicar resena" }).click();
  await expect(page.getByRole("heading", { name: "Tu resena", exact: true })).toBeVisible();

  // detalle (anonimo tambien lo ve)
  await page.goto(`/cursos/${SEO}`);
  await expect(page.getByText("4,0").first()).toBeVisible();
  await expect(page.getByText("(2 resenas)").first()).toBeVisible();

  // catalogo
  await page.goto("/cursos");
  const card = page.getByRole("listitem").filter({ hasText: "SEO practico para negocios" });
  await expect(card.getByText("4,0")).toBeVisible();
  await expect(card.getByText("(2 resenas)")).toBeVisible();
  await expect(card.getByText("Aun sin valoraciones")).toHaveCount(0);
});

test("un estudiante edita su resena y el promedio se actualiza", async ({ page }) => {
  await enrollAndOpen(page, ACCOUNTS.student2);
  await page.getByLabel("Calificacion").selectOption("5");
  await page.getByRole("button", { name: "Guardar resena" }).click();
  await expect(page.getByText("Resena actualizada.")).toBeVisible();

  await page.goto(`/cursos/${SEO}`);
  await expect(page.getByText("5,0").first()).toBeVisible();
});

test("una segunda resena del mismo estudiante no es posible: el formulario ya es de edicion", async ({ page }) => {
  await enrollAndOpen(page, ACCOUNTS.student1);
  await expect(page.getByText("Deja tu resena")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Publicar resena" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Tu resena", exact: true })).toBeVisible();
});

test("un estudiante elimina su resena y vuelve a mostrarse el formulario", async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await enrollAndOpen(page, ACCOUNTS.student2);
  await page.getByRole("button", { name: "Eliminar resena" }).click();
  await expect(page.getByText("Deja tu resena")).toBeVisible();

  await page.goto(`/cursos/${SEO}`);
  await expect(page.getByText("(1 resena)").first()).toBeVisible();
});

test("el promedio se recalcula al eliminar y un curso sin resenas vuelve a 'sin valoraciones'", async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await enrollAndOpen(page, ACCOUNTS.student1);
  await page.getByRole("button", { name: "Eliminar resena" }).click();
  await expect(page.getByText("Deja tu resena")).toBeVisible();

  await page.goto("/cursos");
  const card = page.getByRole("listitem").filter({ hasText: "SEO practico para negocios" });
  await expect(card.getByText("Aun sin valoraciones")).toBeVisible();
});
