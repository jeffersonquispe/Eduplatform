#!/usr/bin/env node
// PreToolUse hook (Write|Edit): aplica mecanicamente dos reglas de CLAUDE.md / code-reviewer.md
// que no requieren criterio, solo deteccion de patron:
//   1. Cualquier aparicion de "service_role" dentro de src/ es BLOCKING (la unica excepcion es
//      tests/support/escenario.ts y supabase/tests/*, que estan fuera de src/).
//   2. Una migracion nueva que crea una tabla (CREATE TABLE) debe habilitar RLS en el mismo
//      archivo (ENABLE ROW LEVEL SECURITY); si no, la tabla queda sin RLS hasta la siguiente
//      migracion, que es exactamente el hueco que buscan supabase/tests/rls_enabled.sql.
//
// Solo se puede verificar la regla 2 en Write (el hook recibe el archivo completo). En Edit solo
// se ve el fragmento cambiado (old_string/new_string), asi que no se bloquea: lo vera el
// code-reviewer al revisar el diff completo.

let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const toolName = input.tool_name || "";
  const toolInput = input.tool_input || {};
  const filePath = toolInput.file_path || "";
  const normPath = filePath.replace(/\\/g, "/");

  function block(reason) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: reason,
        },
      })
    );
    process.exit(0);
  }

  // Regla 1: service_role fuera de las rutas permitidas.
  const esRutaPermitida = /^(tests\/support\/escenario\.ts|supabase\/tests\/)/.test(normPath);
  if (normPath.startsWith("src/") && !esRutaPermitida) {
    const content = [toolInput.content, toolInput.new_string].filter((v) => typeof v === "string").join("\n");
    if (content.includes("service_role")) {
      block(
        `Bloqueado por hook de seguridad: "${filePath}" esta dentro de src/ y el contenido contiene ` +
          `"service_role". Segun CLAUDE.md, la service_role key nunca va en src/ (solo en ` +
          "tests/support/escenario.ts o supabase/tests/*, fuera de la app); usa siempre la anon key en codigo de la app."
      );
    }
  }

  // Regla 2: tabla nueva sin RLS en la misma migracion (solo Write, donde se ve el archivo completo).
  if (toolName === "Write" && /^supabase\/migrations\/.*\.sql$/.test(normPath)) {
    const content = typeof toolInput.content === "string" ? toolInput.content : "";
    const tablas = [...content.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?"?(\w+)"?/gi)].map((m) => m[1]);
    const sinRls = tablas.filter((t) => {
      const re = new RegExp(`alter\\s+table\\s+"?${t}"?\\s+enable\\s+row\\s+level\\s+security`, "i");
      return !re.test(content);
    });
    if (sinRls.length > 0) {
      block(
        `Bloqueado por hook de seguridad: "${filePath}" crea la(s) tabla(s) ${sinRls.join(", ")} sin ` +
          `"ALTER TABLE ... ENABLE ROW LEVEL SECURITY" en el mismo archivo. Segun CLAUDE.md, cada tabla nueva ` +
          "habilita RLS en su propia migracion (y necesita policies); agregalo antes de crear el archivo."
      );
    }
  }

  process.exit(0);
});
