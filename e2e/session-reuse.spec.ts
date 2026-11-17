import { expect, test } from "@playwright/test";
import { AUTH_STATE } from "./auth-state";

// Comprueba que las sesiones guardadas por auth.setup.ts se reutilizan sin pasar por /login.

test.describe("sesion de instructor reutilizada", () => {
  test.use({ storageState: AUTH_STATE.instructor });

  test("entra directo al panel del instructor", async ({ page }) => {
    await page.goto("/instructor");
    await expect(page).toHaveURL(/\/instructor$/);
  });
});

test.describe("sesion de estudiante reutilizada", () => {
  test.use({ storageState: AUTH_STATE.student });

  test("entra directo a Mis cursos y no al panel del instructor", async ({ page }) => {
    await page.goto("/mis-cursos");
    await expect(page).toHaveURL(/\/mis-cursos$/);
    await page.goto("/instructor");
    await expect(page).toHaveURL(/\/$/);
  });
});
