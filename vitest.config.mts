import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// Unitarias: src/**/*.test.ts. Integracion: src/**/*.integration.test.ts.
// Las pruebas de Playwright (e2e/*.spec.ts) quedan fuera.
export default defineConfig(({ mode }) => ({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // Credenciales de las pruebas de integracion (.env.test.local, fuera de git): solo variables SUPABASE_TEST_*.
    env: loadEnv(mode, process.cwd(), "SUPABASE_TEST_"),
    exclude: ["**/node_modules/**", "e2e/**", ".next/**"],
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["**/node_modules/**", "e2e/**", ".next/**", "src/**/*.integration.test.{ts,tsx}"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          // Preparar el escenario crea usuarios en la nube: tarda varios segundos.
          testTimeout: 60_000,
          hookTimeout: 60_000,
          include: ["src/**/*.integration.test.{ts,tsx}"],
        },
      },
    ],
  },
}));
