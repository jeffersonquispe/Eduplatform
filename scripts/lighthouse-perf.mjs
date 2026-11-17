// Mide con Lighthouse (perfil movil, solo rendimiento) las paginas clave: N corridas por pagina,
// guarda cada informe crudo y resume con la mediana de cada metrica.
//
// Uso:  PERF_TOOLS_DIR=<carpeta con lighthouse, chrome-launcher y playwright-core instalados>
//       BASE_URL=http://localhost:3200 OUT_DIR=reports/perf/antes node scripts/lighthouse-perf.mjs
// Las paginas con sesion reutilizan playwright/.auth/{student,instructor}.json (e2e/auth.setup.ts).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const TOOLS = process.env.PERF_TOOLS_DIR;
if (!TOOLS) throw new Error("Falta PERF_TOOLS_DIR (carpeta donde se instalo lighthouse).");
const req = createRequire(path.join(TOOLS, "package.json"));
const lighthouse = (await import(pathToFileURL(req.resolve("lighthouse")).href)).default;
const chromeLauncher = req("chrome-launcher");
const { chromium } = req("playwright-core");

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3200";
const OUT_DIR = path.resolve(process.env.OUT_DIR ?? "reports/perf/antes");
const RUNS = Number(process.env.RUNS ?? 3);
const AUTH = {
  student: path.resolve("playwright/.auth/student.json"),
  instructor: path.resolve("playwright/.auth/instructor.json"),
};

fs.mkdirSync(OUT_DIR, { recursive: true });

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

async function withChrome(role, fn) {
  const chrome = await chromeLauncher.launch({
    chromePath: process.env.CHROME_PATH,
    chromeFlags: ["--headless=new", "--disable-gpu", "--no-sandbox"],
  });
  try {
    if (role) {
      // Copia las cookies guardadas al contexto por defecto del Chrome que usara Lighthouse.
      const browser = await chromium.connectOverCDP(`http://127.0.0.1:${chrome.port}`);
      const state = JSON.parse(fs.readFileSync(AUTH[role], "utf8"));
      await browser.contexts()[0].addCookies(state.cookies);
      await browser.close(); // solo desconecta; el Chrome sigue vivo
    }
    return await fn(chrome.port);
  } finally {
    await chrome.kill();
  }
}

async function runLighthouse(url, role) {
  return withChrome(role, async (port) => {
    const result = await lighthouse(url, {
      port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance"],
      // formFactor "mobile" + throttling simulado 4G lento + CPU x4: valores por defecto de Lighthouse.
    });
    return result.lhr;
  });
}

// Descubre una leccion con la sesion del estudiante (null si no esta inscrito en nada: no se escribe en la BD).
async function discoverLesson() {
  const browser = await chromium.launch({ channel: "chrome" });
  const ctx = await browser.newContext({ storageState: AUTH.student, baseURL: BASE_URL });
  const page = await ctx.newPage();
  await page.goto("/mis-cursos");
  await page.waitForLoadState("networkidle");
  const courseHref = await page.locator('a[href^="/aprender/"]').first().getAttribute("href", { timeout: 3000 }).catch(() => null);
  let lessonHref = null;
  if (courseHref) {
    await page.goto(courseHref);
    lessonHref = await page.locator(`a[href^="${courseHref}/"]`).first().getAttribute("href", { timeout: 3000 }).catch(() => null);
  }
  await browser.close();
  return lessonHref;
}

// Un curso publico cualquiera del catalogo para la pagina de detalle.
const catalog = await (await fetch(BASE_URL + "/cursos")).text();
const courseId = catalog.match(/href="\/cursos\/([0-9a-f-]{36})"/)?.[1];
const lessonPath = await discoverLesson();
const targets = [
  { name: "home", path: "/", role: null },
  { name: "cursos", path: "/cursos", role: null },
  { name: "curso-detalle", path: `/cursos/${courseId}`, role: null },
  ...(lessonPath ? [{ name: "leccion", path: lessonPath, role: "student" }] : []),
  { name: "mis-cursos", path: "/mis-cursos", role: "student" },
];
if (!lessonPath) console.warn("AVISO: el estudiante guardado no esta inscrito en ningun curso; se omite la pagina de leccion.");

// ONLY=home,cursos limita las paginas medidas.
const sumBytes = (a, type) =>
  a["network-requests"].details.items.filter((r) => r.resourceType === type).reduce((n, r) => n + r.transferSize, 0);

const summary = [];
for (const t of targets.filter((x) => !process.env.ONLY || process.env.ONLY.split(",").includes(x.name))) {
  const runs = [];
  for (let i = 1; i <= RUNS; i++) {
    const lhr = await runLighthouse(BASE_URL + t.path, t.role);
    fs.writeFileSync(path.join(OUT_DIR, `${t.name}-run${i}.json`), JSON.stringify(lhr, null, 2));
    const finalPath = new URL(lhr.finalDisplayedUrl).pathname;
    const a = lhr.audits;
    const run = {
      score: Math.round(lhr.categories.performance.score * 100),
      lcp: a["largest-contentful-paint"].numericValue,
      cls: a["cumulative-layout-shift"].numericValue,
      bytes: a["total-byte-weight"].numericValue,
      fcp: a["first-contentful-paint"].numericValue,
      tbt: a["total-blocking-time"].numericValue,
      // Metricas observadas (sin throttling) y desglose de red: distinguen mejor entre paginas que el LCP simulado.
      obsLcp: a.metrics.details.items[0].observedLargestContentfulPaint,
      obsFcp: a.metrics.details.items[0].observedFirstContentfulPaint,
      docEnd: a["network-requests"].details.items[0].networkEndTime,
      jsBytes: sumBytes(a, "Script"),
      fontBytes: sumBytes(a, "Font"),
      finalPath,
      error: lhr.runtimeError?.code ?? null,
    };
    runs.push(run);
    console.log(`${t.name} #${i}: score ${run.score}, LCP ${(run.lcp / 1000).toFixed(2)}s, CLS ${run.cls.toFixed(3)}, ${(run.bytes / 1024).toFixed(0)} KiB${finalPath !== t.path ? `  !! termino en ${finalPath}` : ""}`);
  }
  summary.push({
    ...t,
    runs,
    median: Object.fromEntries(["score", "lcp", "cls", "bytes", "fcp", "tbt", "obsLcp", "obsFcp", "docEnd", "jsBytes", "fontBytes"].map((k) => [k, median(runs.map((r) => r[k]))])),
    redirected: runs.some((r) => r.finalPath !== t.path),
  });
}

fs.writeFileSync(path.join(OUT_DIR, "summary.json"), JSON.stringify({ baseUrl: BASE_URL, runs: RUNS, summary }, null, 2));
console.log("\nListo: " + path.join(OUT_DIR, "summary.json"));
