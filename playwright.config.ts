import { defineConfig, devices } from "@playwright/test";

// Las credenciales E2E_* (ver .env.example) viven en .env.local; en CI llegan como secretos.
try {
  process.loadEnvFile(".env.local");
} catch {
  // sin .env.local: se usan las variables ya presentes en el entorno
}

const PORT = 3100;
// E2E_PROD=1 prueba el build de produccion (next build + next start) en vez del servidor de desarrollo.
const PROD = process.env.E2E_PROD === "1";

// Los tests usan las cuentas de supabase/tests/e2e-fixtures.sql contra el proyecto Supabase de .env.local.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  // En CI tambien genera el reporte HTML (playwright-report/) que se sube como artefacto.
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    // Inicia sesion una vez por rol y guarda las sesiones en playwright/.auth/ (e2e/auth.setup.ts).
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /auth\.setup\.ts/,
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: PROD ? `npm run build && npm run start -- -p ${PORT}` : `npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: PROD ? 300_000 : 120_000,
    // Origen falso del asistente: e2e/assistant.spec.ts lo simula con page.route, sin depender de Edy.
    env: { NEXT_PUBLIC_EDY_URL: "http://edy.test", NEXT_DIST_DIR: ".next-e2e" },
  },
});
