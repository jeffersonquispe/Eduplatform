import fs from "node:fs";
import path from "node:path";
import { PROJECT_ROOT } from "./env.js";

export const APP_DIR = path.join(PROJECT_ROOT, "src", "app");

const HTTP_METHOD_RE = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g;

// App Router de Next.js: cada carpeta es un segmento de ruta, salvo los grupos "(nombre)"
// que no aparecen en la URL. "page.*" define una pagina y "route.*" un endpoint de API.
function segmentsToRoute(relDir) {
  if (relDir === ".") return "/";
  const segments = relDir
    .split(path.sep)
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")));
  if (segments.length === 0) return "/";
  return "/" + segments.join("/");
}

function detectMethods(absFile) {
  const content = fs.readFileSync(absFile, "utf8");
  const methods = new Set();
  for (const match of content.matchAll(HTTP_METHOD_RE)) {
    methods.add(match[1]);
  }
  return [...methods];
}

function walk(dir, pages, apiRoutes) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs, pages, apiRoutes);
      continue;
    }
    if (!entry.isFile()) continue;

    const relDir = path.relative(APP_DIR, dir);
    const relFile = path.relative(APP_DIR, abs).split(path.sep).join("/");
    const route = segmentsToRoute(relDir === "" ? "." : relDir);

    if (/^page\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      pages.push({ route, file: relFile });
    } else if (/^route\.(ts|js)$/.test(entry.name)) {
      apiRoutes.push({ route, file: relFile, methods: detectMethods(abs) });
    }
  }
}

export function getSiteMap() {
  const pages = [];
  const apiRoutes = [];
  walk(APP_DIR, pages, apiRoutes);
  pages.sort((a, b) => a.route.localeCompare(b.route));
  apiRoutes.sort((a, b) => a.route.localeCompare(b.route));
  return { pages, apiRoutes };
}
