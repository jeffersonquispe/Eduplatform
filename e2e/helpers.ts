import type { Page } from "@playwright/test";

// Cuentas creadas por supabase/tests/e2e-fixtures.sql.
export const PASSWORD = "E2e-Passw0rd!";
export const ACCOUNTS = {
  instructorA: "instructor-a@e2e-test.local",
  instructorB: "instructor-b@e2e-test.local",
  student1: "student-1@e2e-test.local",
  student2: "student-2@e2e-test.local",
};

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contrasena").fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
}
