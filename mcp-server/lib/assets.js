import fs from "node:fs";
import path from "node:path";
import { PROJECT_ROOT } from "./env.js";

export const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");

function walk(dir, baseDir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(abs, baseDir));
    } else if (entry.isFile()) {
      const rel = path.relative(baseDir, abs).split(path.sep).join("/");
      out.push({ path: rel, bytes: fs.statSync(abs).size });
    }
  }
  return out;
}

export function listPublicAssets() {
  return walk(PUBLIC_DIR, PUBLIC_DIR);
}

// Resuelve la ruta pedida contra la carpeta public y rechaza cualquier intento
// de escapar de ella (rutas absolutas, "..", symlinks que apunten afuera).
export function resolvePublicAssetPath(requestedPath) {
  if (typeof requestedPath !== "string" || requestedPath.length === 0) {
    throw new Error("La ruta es obligatoria.");
  }

  const candidate = path.resolve(PUBLIC_DIR, requestedPath);
  const relative = path.relative(PUBLIC_DIR, candidate);

  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Ruta fuera de la carpeta de assets publicos: "${requestedPath}"`);
  }

  if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
    throw new Error(`No existe el archivo "${requestedPath}" en la carpeta de assets publicos.`);
  }

  // Confirma que el archivo real (tras resolver symlinks) sigue dentro de public.
  const realPublicDir = fs.realpathSync(PUBLIC_DIR);
  const realCandidate = fs.realpathSync(candidate);
  const realRelative = path.relative(realPublicDir, realCandidate);
  if (realRelative.startsWith("..") || path.isAbsolute(realRelative)) {
    throw new Error(`Ruta fuera de la carpeta de assets publicos: "${requestedPath}"`);
  }

  return candidate;
}

const TEXT_EXTENSIONS = new Set([".svg", ".txt", ".json", ".css", ".html", ".js", ".md", ".xml"]);

export function readPublicAsset(requestedPath) {
  const absPath = resolvePublicAssetPath(requestedPath);
  const ext = path.extname(absPath).toLowerCase();
  const buffer = fs.readFileSync(absPath);

  if (TEXT_EXTENSIONS.has(ext)) {
    return { path: requestedPath, encoding: "utf8", content: buffer.toString("utf8") };
  }
  return { path: requestedPath, encoding: "base64", content: buffer.toString("base64") };
}
