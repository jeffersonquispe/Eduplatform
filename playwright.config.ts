import { defineConfig, devices } from "@playwright/test";

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
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: PROD ? `npm run build && npm run start -- -p ${PORT}` : `npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: PROD ? 300_000 : 120_000,
  },
});
