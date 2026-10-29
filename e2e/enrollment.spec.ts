import { expect, test } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

const SEO = "c1c1c1c1-e2e0-0000-0000-000000000001"; // publicado, de instructor A
const SEO_LESSON_1 = "e1e1e1e1-e2e0-0000-0000-000000000001";
const SEO_LESSON_2 = "e2e2e2e2-e2e0-0000-0000-000000000002";
const DRAFT = "d4d4d4d4-e2e0-0000-0000-000000000004";
const DRAFT_LESSON = "e6e6e6e6-e2e0-0000-0000-000000000006";

// El estado de inscripcion se arrastra entre tests: se ejecutan en orden.
test.describe.configure({ mode: "serial" });

test("un visitante anonimo debe iniciar sesion para inscribirse y vuelve al curso", async ({ page }) => {
  await page.goto(`/cursos/${SEO}`);
  await expect(page.getByRole("button", { name: "Inscribirme gratis" })).toHaveCount(0);
  await page.getByRole("link", { name: "Inicia sesion para inscribirte" }).click();
  await expect(page).toHaveURL(new RegExp(`/login\\?next=%2Fcursos%2F${SEO}`));

  await page.getByLabel("Correo").fill(ACCOUNTS.student1);
  await page.getByLabel("Contrasena").fill("E2e-Passw0rd!");
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await expect(page).toHaveURL(new RegExp(`/cursos/${SEO}$`));
  await expect(page.getByRole("button", { name: "Inscribirme gratis" })).toBeVisible();
});

test("el contenido de las lecciones exige sesion", async ({ page }) => {
  await page.goto(`/aprender/${SEO}/${SEO_LESSON_1}`);
  await expect(page).toHaveURL(/\/login\?next=/);
});

test("un estudiante no inscrito no accede al contenido", async ({ page }) => {
  await login(page, ACCOUNTS.student1);
  await expect(page).toHaveURL(/\/mis-cursos$/);
  await page.goto(`/aprender/${SEO}/${SEO_LESSON_1}`);
  await expect(page).toHaveURL(new RegExp(`/cursos/${SEO}$`));
  expect(await page.content()).not.toContain("CONTENIDO-SECRETO");
});

test("un estudiante se inscribe y ve el contenido de las lecciones", async ({ page }) => {
  await login(page, ACCOUNTS.student1);
  await expect(page).toHaveURL(/\/mis-cursos$/);
  await expect(page.getByText("Aun no estas inscrito en ningun curso.")).toBeVisible();

  await page.goto(`/cursos/${SEO}`);
  await page.getByRole("button", { name: "Inscribirme gratis" }).click();
  await expect(page).toHaveURL(new RegExp(`/aprender/${SEO}/${SEO_LESSON_1}$`));
  await expect(page.getByRole("heading", { name: "Que es el SEO", level: 1 })).toBeVisible();
  await expect(page.getByText("CONTENIDO-SECRETO-Que es el SEO")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver video de la leccion" })).toHaveAttribute("rel", /noopener/);

  // navegacion entre lecciones
  await page.getByRole("link", { name: /Palabras clave →/ }).click();
  await expect(page).toHaveURL(new RegExp(`/aprender/${SEO}/${SEO_LESSON_2}$`));
  await expect(page.getByText("CONTENIDO-SECRETO-Palabras clave")).toBeVisible();

  // aparece en Mis cursos y el detalle ofrece "Ir al curso"
  await page.goto("/mis-cursos");
  await expect(page.getByRole("heading", { name: "SEO practico para negocios" })).toBeVisible();
  await page.goto(`/cursos/${SEO}`);
  await expect(page.getByRole("link", { name: "Ir al curso" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Inscribirme gratis" })).toHaveCount(0);
});

test("otro estudiante no ve inscripciones ni contenido ajenos", async ({ page }) => {
  await login(page, ACCOUNTS.student2);
  await expect(page).toHaveURL(/\/mis-cursos$/);
  await expect(page.getByText("Aun no estas inscrito en ningun curso.")).toBeVisible();
  await expect(page.getByText("SEO practico para negocios")).toHaveCount(0);

  await page.goto(`/aprender/${SEO}/${SEO_LESSON_1}`);
  await expect(page).toHaveURL(new RegExp(`/cursos/${SEO}$`));
  expect(await page.content()).not.toContain("CONTENIDO-SECRETO");
});

test("no se puede inscribir ni aprender en un curso en borrador", async ({ page }) => {
  await login(page, ACCOUNTS.student1);
  await expect(page).toHaveURL(/\/mis-cursos$/);
  await page.goto(`/cursos/${DRAFT}`);
  await expect(page.getByRole("heading", { name: "Pagina no encontrada" })).toBeVisible();
  await page.goto(`/aprender/${DRAFT}/${DRAFT_LESSON}`);
  await expect(page.getByRole("heading", { name: "Pagina no encontrada" })).toBeVisible();
  expect(await page.content()).not.toContain("CONTENIDO-SECRETO");
});

test("el instructor propietario ve su contenido; otro instructor no; ninguno se inscribe", async ({ browser }) => {
  const a = await (await browser.newContext()).newPage();
  await login(a, ACCOUNTS.instructorA);
  await expect(a).toHaveURL(/\/instructor$/);
  await a.goto(`/aprender/${SEO}/${SEO_LESSON_1}`);
  await expect(a.getByText("CONTENIDO-SECRETO-Que es el SEO")).toBeVisible();
  await a.goto(`/aprender/${DRAFT}/${DRAFT_LESSON}`);
  await expect(a.getByText("CONTENIDO-SECRETO-Leccion del borrador")).toBeVisible();
  await a.goto(`/cursos/${SEO}`);
  await expect(a.getByRole("link", { name: "Editar este curso" })).toBeVisible();

  const b = await (await browser.newContext()).newPage();
  await login(b, ACCOUNTS.instructorB);
  await expect(b).toHaveURL(/\/instructor$/);
  await b.goto(`/aprender/${SEO}/${SEO_LESSON_1}`);
  await expect(b).toHaveURL(new RegExp(`/cursos/${SEO}$`));
  expect(await b.content()).not.toContain("CONTENIDO-SECRETO");
  await expect(b.getByText("Las cuentas de instructor no pueden inscribirse")).toBeVisible();
  await expect(b.getByRole("button", { name: "Inscribirme gratis" })).toHaveCount(0);
});

test("despublicar un curso no quita el acceso a quien ya esta inscrito", async ({ browser }) => {
  const student = await (await browser.newContext()).newPage();
  await login(student, ACCOUNTS.student1);
  await expect(student).toHaveURL(/\/mis-cursos$/);

  const instructor = await (await browser.newContext()).newPage();
  await login(instructor, ACCOUNTS.instructorA);
  await expect(instructor).toHaveURL(/\/instructor$/);
  await instructor.goto(`/instructor/cursos/${SEO}`);
  await instructor.getByRole("button", { name: "Despublicar" }).click();
  await expect(instructor.getByText("Curso despublicado.")).toBeVisible();

  try {
    // sale del catalogo y del detalle publico...
    await student.goto("/cursos");
    await expect(student.getByRole("link", { name: "SEO practico para negocios" })).toHaveCount(0);
    await student.goto(`/cursos/${SEO}`);
    await expect(student.getByRole("heading", { name: "Pagina no encontrada" })).toBeVisible();

    // ...pero el inscrito conserva el acceso
    await student.goto(`/aprender/${SEO}/${SEO_LESSON_1}`);
    await expect(student.getByText("CONTENIDO-SECRETO-Que es el SEO")).toBeVisible();
    await student.goto("/mis-cursos");
    await expect(student.getByText("Ya no esta en el catalogo")).toBeVisible();
  } finally {
    await instructor.goto(`/instructor/cursos/${SEO}`);
    await instructor.getByRole("button", { name: "Publicar curso" }).click();
    await expect(instructor.getByText("Curso publicado.")).toBeVisible();
  }
});

test("cancelar la inscripcion quita el acceso al contenido", async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await login(page, ACCOUNTS.student1);
  await expect(page).toHaveURL(/\/mis-cursos$/);
  await page.goto(`/aprender/${SEO}/${SEO_LESSON_1}`);
  await expect(page.getByText("CONTENIDO-SECRETO-Que es el SEO")).toBeVisible();

  await page.getByRole("button", { name: "Cancelar inscripcion" }).click();
  await expect(page).toHaveURL(new RegExp(`/cursos/${SEO}$`));
  await expect(page.getByRole("button", { name: "Inscribirme gratis" })).toBeVisible();

  await page.goto(`/aprender/${SEO}/${SEO_LESSON_1}`);
  await expect(page).toHaveURL(new RegExp(`/cursos/${SEO}$`));
  expect(await page.content()).not.toContain("CONTENIDO-SECRETO");
  await page.goto("/mis-cursos");
  await expect(page.getByText("Aun no estas inscrito en ningun curso.")).toBeVisible();
});
