import { expect, test } from "@playwright/test";
import { ACCOUNTS, PASSWORD, login } from "./helpers";

test("instructor inicia sesion y llega a su panel", async ({ page }) => {
  await login(page, ACCOUNTS.instructorA);
  await expect(page).toHaveURL(/\/instructor$/);
  await expect(page.getByRole("heading", { name: "Panel del instructor" })).toBeVisible();
});

test("estudiante inicia sesion y llega a Mis cursos", async ({ page }) => {
  await login(page, ACCOUNTS.student1);
  await expect(page).toHaveURL(/\/mis-cursos$/);
  await expect(page.getByRole("heading", { name: "Mis cursos" })).toBeVisible();
});

test("la sesion persiste al recargar", async ({ page }) => {
  await login(page, ACCOUNTS.student1);
  await expect(page).toHaveURL(/\/mis-cursos$/);
  await page.reload();
  await expect(page).toHaveURL(/\/mis-cursos$/);
  await expect(page.getByRole("heading", { name: "Mis cursos" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();
});

test("credenciales invalidas dan un mensaje generico", async ({ page }) => {
  await login(page, ACCOUNTS.student1, "contrasena-incorrecta");
  const wrongPassword = await page.locator('p[role="alert"]').innerText();
  await page.reload();
  await login(page, "no-existe@e2e-test.local", "contrasena-incorrecta");
  const wrongEmail = await page.locator('p[role="alert"]').innerText();

  expect(wrongPassword).toBe("Correo o contrasena incorrectos.");
  expect(wrongEmail).toBe(wrongPassword);
  await expect(page).toHaveURL(/\/login/);
});

test("cerrar sesion devuelve al inicio y bloquea las rutas protegidas", async ({ page }) => {
  await login(page, ACCOUNTS.student1);
  await expect(page).toHaveURL(/\/mis-cursos$/);
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Iniciar sesion" }).first()).toBeVisible();

  await page.goto("/mis-cursos");
  await expect(page).toHaveURL(/\/login\?next=%2Fmis-cursos/);
});

test("visitante anonimo es enviado a login desde el panel del instructor", async ({ page }) => {
  await page.goto("/instructor");
  await expect(page).toHaveURL(/\/login\?next=%2Finstructor/);
});

test("un estudiante no entra al panel del instructor", async ({ page }) => {
  await login(page, ACCOUNTS.student1);
  await expect(page).toHaveURL(/\/mis-cursos$/);
  await page.goto("/instructor");
  await expect(page).toHaveURL(/\/$/);
});

test("un instructor no entra a Mis cursos de estudiante", async ({ page }) => {
  await login(page, ACCOUNTS.instructorA);
  await expect(page).toHaveURL(/\/instructor$/);
  await page.goto("/mis-cursos");
  await expect(page).toHaveURL(/\/$/);
});

test("el parametro next no permite redirecciones externas", async ({ page }) => {
  await page.goto("/login?next=//evil.example");
  await page.getByLabel("Correo").fill(ACCOUNTS.student1);
  await page.getByLabel("Contrasena").fill(PASSWORD);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await expect(page).toHaveURL(/localhost:3100\/mis-cursos$/);
});

test("el perfil publico del instructor no expone el correo", async ({ page }) => {
  const res = await page.goto("/instructores/aaaaaaaa-e2e0-0000-0000-000000000001");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Ana Instructora" })).toBeVisible();
  const html = await page.content();
  expect(html).not.toContain("e2e-test.local");
});

test("perfil de un estudiante o de un id inexistente muestra no encontrado", async ({ page }) => {
  // Con streaming el estado HTTP ya es 200; lo verificable es el contenido.
  await page.goto("/instructores/11111111-e2e0-0000-0000-000000000003");
  await expect(page.getByRole("heading", { name: "Pagina no encontrada" })).toBeVisible();
  await expect(page.getByText("Sofia Estudiante")).toHaveCount(0);
  await page.goto("/instructores/no-es-un-uuid");
  await expect(page.getByRole("heading", { name: "Pagina no encontrada" })).toBeVisible();
});

test("el registro rechaza una contrasena corta en el servidor", async ({ page }) => {
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Prueba");
  await page.getByLabel("Correo").fill("prueba@e2e-test.local");
  // Se salta la validacion HTML para probar la validacion del servidor.
  await page.getByLabel(/Contrasena/).evaluate((el: HTMLInputElement) => {
    el.removeAttribute("minlength");
    el.value = "corta";
  });
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("al menos 8 caracteres");
});
