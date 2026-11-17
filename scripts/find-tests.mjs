#!/usr/bin/env node
// Busca, por palabras clave, nombres de pruebas del repositorio que PODRIAN cubrir un criterio.
//
//   npm run find-tests -- "un estudiante inscrito puede cancelar su inscripcion"
//   node scripts/find-tests.mjs "criterio" [--kind unit,integration,e2e,sql] [--min N] [--limit N] [--json]
//
// Carpetas: unitarias (src/**/*.test.*), integracion (src/**/*.integration.test.* y tests/**),
// E2E (e2e/*.spec.ts) y SQL (supabase/tests/rls*.sql).
// IMPORTANTE: el resultado son CANDIDATAS por coincidencia de palabras. Que una prueba realmente cubra
// el criterio se decide leyendola: esta herramienta no lo determina.

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set(["node_modules", ".next", ".next-e2e", ".git", "test-results", "playwright-report"]);
const KINDS = ["unit", "integration", "e2e", "sql"];

export const AVISO =
  "CANDIDATAS, no confirmadas: se eligieron por coincidencia de palabras clave en el nombre. " +
  "Decidir si una prueba realmente cubre el criterio requiere leer su codigo; eso le toca al agente.";

// ---------- palabras clave ----------
const STOPWORDS = new Set(
  ("de la el los las un una unos unas y o a en con por para que se su sus al del es son lo como mas pero sin sobre " +
    "entre cuando si no puede pueden debe deben sistema shall must should when then and the of to ser esta este " +
    "ese esa ya solo tambien").split(" "),
);

const normalize = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const words = (s) => normalize(s).split(/[^a-z0-9]+/).filter(Boolean);

export function keywords(criterio) {
  return [...new Set(words(criterio).filter((w) => w.length >= 3 && !STOPWORDS.has(w)))];
}

// Raiz recortada para tolerar variantes ("inscribir" ~ "inscripcion", "resenas" ~ "resena").
const stem = (w) => (w.length > 6 ? w.slice(0, 6) : w.length > 4 ? w.replace(/(es|s)$/, "") : w);

function matchedKeywords(kws, text) {
  const ws = words(text);
  return kws.filter((k) => {
    const s = stem(k);
    return ws.some((w) => w.startsWith(s));
  });
}

// ---------- recorrido de archivos ----------
function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const rel = (f) => path.relative(ROOT, f).split(path.sep).join("/");

function classify(file) {
  const r = rel(file);
  if (/^supabase\/tests\/rls[^/]*\.sql$/.test(r)) return "sql";
  if (/^e2e\/[^/]+\.spec\.tsx?$/.test(r)) return "e2e";
  if (/^src\/.*\.integration\.test\.tsx?$/.test(r) || /^tests\/.*\.test\.tsx?$/.test(r)) return "integration";
  if (/^src\/.*\.test\.tsx?$/.test(r)) return "unit";
  return null;
}

// ---------- extraccion de nombres ----------
const TEST_RE = /\b(test|it)(?:\.(?:only|skip|fixme|fails|concurrent))?\s*\(\s*(["'`])((?:\\.|(?!\2).)*)\2/;
const DESCRIBE_RE = /\b(?:test\.)?describe(?:\.(?:serial|parallel|only|skip))?\s*\(\s*(["'`])((?:\\.|(?!\1).)*)\1/;
const STEP_RE = /\btest\.step\s*\(\s*(["'`])((?:\\.|(?!\1).)*)\1/;

function extractJs(file, kind) {
  const found = [];
  const stack = [];
  readFileSync(file, "utf8").split(/\r?\n/).forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const indent = line.length - line.trimStart().length;
    if (!/^[})\]]/.test(trimmed)) {
      while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    }
    const d = DESCRIBE_RE.exec(line);
    if (d) {
      stack.push({ indent, name: d[2] });
      return;
    }
    const group = stack.map((s) => s.name).join(" > ");
    const t = TEST_RE.exec(line);
    if (t) found.push({ kind, file: rel(file), line: i + 1, name: t[3], group, tipo: "prueba" });
    const s = STEP_RE.exec(line);
    if (s) found.push({ kind, file: rel(file), line: i + 1, name: s[2], group, tipo: "paso" });
  });
  return found;
}

function extractSql(file) {
  const found = [];
  let section = "";
  readFileSync(file, "utf8").split(/\r?\n/).forEach((line, i) => {
    const h = /^--\s*=+\s*(.+?)\s*=+\s*$/.exec(line);
    if (h) {
      section = h[1];
      return;
    }
    const m = /'((?:ASSERT|EXPECTED[A-Z_]*)\b[^']*)'/.exec(line) || /raise exception\s+'([^']*)'/i.exec(line);
    if (m) {
      const name = m[1].replace(/^ASSERT\s+/, "").replace(/^EXPECTED[A-Z_]*:?\s*/, "");
      found.push({ kind: "sql", file: rel(file), line: i + 1, name, group: section, tipo: "asercion" });
    }
  });
  return found;
}

export function collectTests(kinds = KINDS) {
  const all = [];
  for (const file of walk(ROOT)) {
    const kind = classify(file);
    if (!kind || !kinds.includes(kind)) continue;
    all.push(...(kind === "sql" ? extractSql(file) : extractJs(file, kind)));
  }
  return all;
}

// ---------- busqueda ----------
export function findTests(criterio, { kinds, min, limit = 25 } = {}) {
  const kws = keywords(criterio);
  const needed = min ?? Math.max(1, Math.ceil(kws.length / 2));
  const candidatas = collectTests(kinds)
    .map((t) => {
      const enNombre = matchedKeywords(kws, t.name);
      const enContexto = matchedKeywords(kws, t.group).filter((k) => !enNombre.includes(k));
      return { ...t, coincidencias: [...enNombre, ...enContexto], enNombre: enNombre.length };
    })
    .filter((t) => t.coincidencias.length >= needed && t.enNombre >= 1)
    .sort(
      (a, b) =>
        b.coincidencias.length - a.coincidencias.length ||
        b.enNombre - a.enNombre ||
        a.file.localeCompare(b.file) ||
        a.line - b.line,
    );
  return {
    aviso: AVISO,
    criterio,
    palabras_clave: kws,
    minimo_de_coincidencias: needed,
    total_candidatas: candidatas.length,
    candidatas: candidatas.slice(0, limit).map(({ enNombre, ...t }) => ({
      ...t,
      coincide_con: `${t.coincidencias.length}/${kws.length}`,
    })),
  };
}

// ---------- CLI ----------
function format(r) {
  const out = [`>>> ${r.aviso}`, "", `Criterio: ${r.criterio}`, `Palabras clave: ${r.palabras_clave.join(", ") || "(ninguna)"}`];
  const shown = r.candidatas.length < r.total_candidatas ? ` (se muestran ${r.candidatas.length})` : "";
  out.push(`Candidatas: ${r.total_candidatas}${shown} - minimo de coincidencias: ${r.minimo_de_coincidencias}`, "");
  for (const c of r.candidatas) {
    out.push(`[${c.kind}] ${c.file}:${c.line}  (${c.tipo}, ${c.coincide_con})`);
    out.push(`    ${c.name}`);
    if (c.group) out.push(`    en: ${c.group}`);
    out.push(`    palabras: ${c.coincidencias.join(", ")}`);
  }
  if (!r.candidatas.length) {
    out.push("Sin candidatas: prueba con menos palabras o sinonimos (--min 1). Puede que el criterio no tenga prueba.");
  }
  out.push("", `>>> ${r.aviso}`);
  return out.join("\n");
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const opt = (name) => {
    const i = args.indexOf(name);
    return i === -1 ? undefined : args.splice(i, 2)[1];
  };
  const jsonIdx = args.indexOf("--json");
  const json = jsonIdx !== -1;
  if (json) args.splice(jsonIdx, 1);
  const kind = opt("--kind");
  const min = opt("--min");
  const limit = opt("--limit");
  const criterio = args.join(" ").trim();
  if (!criterio) {
    console.error('Uso: node scripts/find-tests.mjs "criterio" [--kind unit,integration,e2e,sql] [--min N] [--limit N] [--json]');
    process.exit(2);
  }
  const kinds = kind ? kind.split(",").map((k) => k.trim()) : undefined;
  const bad = kinds?.filter((k) => !KINDS.includes(k));
  if (bad?.length) {
    console.error(`--kind desconocido: ${bad.join(", ")}`);
    process.exit(2);
  }
  const result = findTests(criterio, {
    kinds,
    min: min ? Number(min) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  console.log(json ? JSON.stringify(result, null, 2) : format(result));
}
