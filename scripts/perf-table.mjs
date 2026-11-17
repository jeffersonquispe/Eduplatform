// Tabla comparativa a partir de uno o varios summary.json: node scripts/perf-table.mjs etiqueta=dir [etiqueta=dir ...]
// Muestra la mediana de cada metrica (y el rango del puntaje) por pagina.
import fs from "node:fs";
import path from "node:path";

const pages = new Map();
for (const arg of process.argv.slice(2)) {
  const [label, dir] = arg.split("=");
  const { summary } = JSON.parse(fs.readFileSync(path.join(dir, "summary.json"), "utf8"));
  for (const t of summary) {
    if (!pages.has(t.name)) pages.set(t.name, []);
    pages.get(t.name).push({ label, t });
  }
}
const f = (v, d = 0) => (v == null ? "-" : v.toFixed(d));
console.log("| Pagina | Version | Puntaje (rango) | LCP sim. | LCP obs. | FCP obs. | Fin doc. | TBT | CLS | JS | Fuentes | Peso |");
console.log("|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const [name, rows] of pages) {
  for (const { label, t } of rows) {
    const m = t.median, sc = t.runs.map((r) => r.score);
    console.log(
      `| ${name} | ${label} | ${m.score} (${Math.min(...sc)}-${Math.max(...sc)}) | ${f(m.lcp / 1000, 2)} s | ${f(m.obsLcp)} ms | ${f(m.obsFcp)} ms | ${f(m.docEnd)} ms | ${f(m.tbt)} ms | ${f(m.cls, 3)} | ${f(m.jsBytes / 1024)} KiB | ${f(m.fontBytes / 1024)} KiB | ${f(m.bytes / 1024)} KiB |`,
    );
  }
}
