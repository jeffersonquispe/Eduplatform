#!/usr/bin/env node
// Mapea archivos cambiados de un PR a capabilities de openspec/specs/, para que el
// Agente QA solo evalue las partes del producto que el PR realmente toca.
//
//   git diff --name-only <base>...HEAD | node scripts/map-changed-files-to-capabilities.mjs
//
// Es un mapeo heuristico por ruta, no autoritativo: ajusta REGLAS si una capability
// nueva o un archivo movido deja de coincidir.

const REGLAS = [
  { capability: "course-enrollment", test: (f) => /^src\/app\/actions\/enrollments\.ts$/.test(f) || /^src\/lib\/enrollment/.test(f) || /^src\/app\/mis-cursos\//.test(f) || /^src\/app\/aprender\//.test(f) },
  { capability: "course-reviews", test: (f) => /^src\/app\/actions\/reviews\.ts$/.test(f) || /^src\/lib\/reviews/.test(f) || /^src\/components\/review-fields\.tsx$/.test(f) },
  { capability: "course-management", test: (f) => /^src\/app\/actions\/courses\.ts$/.test(f) || /^src\/app\/instructor\//.test(f) || /^src\/app\/instructores\//.test(f) },
  { capability: "course-catalog", test: (f) => /^src\/lib\/courses\.ts$/.test(f) || /^src\/components\/(course-card|course-fields|featured-courses)\.tsx$/.test(f) || /^src\/app\/cursos\//.test(f) },
  { capability: "course-embeddings", test: (f) => /^src\/lib\/embeddings\.ts$/.test(f) || /^src\/app\/api\/courses\//.test(f) },
  { capability: "assistant-widget", test: (f) => /^src\/components\/assistant-widget\.tsx$/.test(f) },
  { capability: "user-roles", test: (f) => /^src\/lib\/auth\.ts$/.test(f) || /^src\/app\/actions\/auth\.ts$/.test(f) || /^src\/components\/auth-forms\.tsx$/.test(f) || /^src\/app\/(login|registro)\//.test(f) },
  { capability: "design-system", test: (f) => /^src\/app\/globals\.css$/.test(f) || /^src\/components\/ui\.tsx$/.test(f) || /^Design System\.md$/.test(f) },
  { capability: "home-agent-workshop", test: (f) => /^src\/components\/taller-agente\.tsx$/.test(f) || /^src\/app\/page\.tsx$/.test(f) },
  // Igual alcance que el skill tech-lead: cualquier pagina o componente puede afectar accesibilidad.
  { capability: "interface-accessibility", test: (f) => /^src\/app\/.*\/(page|layout)\.tsx$/.test(f) || /^src\/app\/(page|layout)\.tsx$/.test(f) || /^src\/components\/.*\.tsx$/.test(f) },
  // assistant-service vive en el repo separado edy-service: ningun archivo de este repo lo activa.
];

function capabilitiesFor(files) {
  const found = new Set();
  for (const f of files) {
    for (const regla of REGLAS) {
      if (regla.test(f)) found.add(regla.capability);
    }
  }
  return [...found].sort();
}

function main() {
  let input = "";
  process.stdin.on("data", (c) => (input += c));
  process.stdin.on("end", () => {
    const files = input.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const caps = capabilitiesFor(files);
    console.log(JSON.stringify(caps));
  });
}

main();
