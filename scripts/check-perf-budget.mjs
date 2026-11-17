// Compara un summary.json de scripts/lighthouse-perf.mjs contra perf-budget.json y emite un
// reporte en Markdown por stdout. Solo informa: nunca falla el proceso (exit siempre 0), porque
// un presupuesto de rendimiento es una senal para una persona, no un gate automatico.
//
// Uso: node scripts/check-perf-budget.mjs <ruta/a/summary.json> [ruta/a/perf-budget.json]
import fs from "node:fs";
import path from "node:path";

const summaryPath = process.argv[2];
if (!summaryPath) throw new Error("Uso: node scripts/check-perf-budget.mjs <summary.json> [perf-budget.json]");
const budgetPath = process.argv[3] ?? path.resolve("perf-budget.json");

const { summary } = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
const budget = JSON.parse(fs.readFileSync(budgetPath, "utf8"));

const METRICAS = [
  { key: "lcp", label: "LCP", unidad: "ms", fmt: (v) => Math.round(v) },
  { key: "cls", label: "CLS", unidad: "", fmt: (v) => v.toFixed(3) },
  { key: "tbt", label: "TBT (proxy de INP)", unidad: "ms", fmt: (v) => Math.round(v) },
];

let huboExceso = false;
const filas = [];
for (const pagina of summary) {
  const limites = budget.paginas?.[pagina.name] ?? budget.default;
  for (const m of METRICAS) {
    const valor = pagina.median[m.key];
    const limite = limites[m.key];
    const excede = valor > limite;
    if (excede) huboExceso = true;
    filas.push({
      pagina: pagina.name,
      metrica: m.label,
      valor: `${m.fmt(valor)}${m.unidad}`,
      limite: `${m.fmt(limite)}${m.unidad}`,
      estado: excede ? "EXCEDE" : "OK",
    });
  }
}

console.log("## Agente de Web Vitals\n");
console.log(`Base: \`${summaryPath}\` (mediana de ${summary[0]?.runs.length ?? "?"} corridas por pagina). Presupuesto: \`${budgetPath}\`.\n`);
console.log("| Pagina | Metrica | Valor | Presupuesto | Estado |");
console.log("|---|---|---|---|---|");
for (const f of filas) {
  console.log(`| ${f.pagina} | ${f.metrica} | ${f.valor} | ${f.limite} | ${f.estado === "OK" ? "OK" : "**EXCEDE**"} |`);
}
console.log(
  huboExceso
    ? "\n**Al menos una pagina excede el presupuesto.** Esto es un informe, no un bloqueo: decide una persona si la regresion es real o ruido de la corrida."
    : "\nTodas las paginas medidas estan dentro del presupuesto."
);
