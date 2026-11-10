import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

// El servidor MCP no corre dentro de Next.js, asi que .env.local no se carga solo.
// Leemos el mismo archivo que usa la app (solo claves que empiecen con NEXT_PUBLIC_)
// sin pisar variables que ya vengan del entorno del proceso.
function loadDotEnvLocal() {
  const envPath = path.join(PROJECT_ROOT, ".env.local");
  let content;
  try {
    content = fs.readFileSync(envPath, "utf8");
  } catch {
    return;
  }

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnvLocal();

export { PROJECT_ROOT };
