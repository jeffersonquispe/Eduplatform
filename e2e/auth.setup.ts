import { expect, test as setup } from "@playwright/test";
import { AUTH_STATE } from "./auth-state";

// Inicia sesion una vez por rol contra Supabase Auth (a traves del formulario de /login) y guarda
// las cookies en playwright/.auth/. Las credenciales salen solo de variables de entorno
// (.env.local en local, secretos en CI); ver .env.example.

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name} (ver .env.example).`);
  return value;
}

const roles = [
  { name: "instructor", email: "E2E_INSTRUCTOR_EMAIL", password: "E2E_INSTRUCTOR_PASSWORD", home: /\/instructor$/ },
  { name: "estudiante", email: "E2E_STUDENT_EMAIL", password: "E2E_STUDENT_PASSWORD", home: /\/mis-cursos$/ },
] as const;

for (const role of roles) {
  setup(`iniciar sesion como ${role.name}`, async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo").fill(env(role.email));
    await page.getByLabel("Contrasena").fill(env(role.password));
    await page.getByRole("button", { name: "Iniciar sesion" }).click();
    await expect(page).toHaveURL(role.home);

    await page.context().storageState({ path: role.name === "instructor" ? AUTH_STATE.instructor : AUTH_STATE.student });
  });
}
