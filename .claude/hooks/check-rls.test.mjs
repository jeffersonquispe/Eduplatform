import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Prueba local (sin IA) del hook .claude/hooks/check-rls.js: lo invoca tal como lo hace
// Claude Code (JSON por stdin) y lee la decision por stdout. Sin salida = permitido.

const HOOK = fileURLToPath(new URL("./check-rls.js", import.meta.url));

function runHook(input) {
  const result = spawnSync(process.execPath, [HOOK], { input: JSON.stringify(input), encoding: "utf8" });
  const out = result.stdout.trim();
  return out ? JSON.parse(out) : null;
}

describe("check-rls.js — service_role solo fuera de src/", () => {
  it("bloquea service_role dentro de src/", () => {
    const decision = runHook({
      tool_name: "Write",
      tool_input: { file_path: "src/lib/supabase-admin.ts", content: "const k = env.service_role_key;" },
    });
    expect(decision?.hookSpecificOutput?.permissionDecision).toBe("deny");
  });

  it("permite service_role en tests/support/escenario.ts", () => {
    const decision = runHook({
      tool_name: "Write",
      tool_input: { file_path: "tests/support/escenario.ts", content: "const k = env.service_role_key;" },
    });
    expect(decision).toBeNull();
  });

  it("permite archivos de src/ sin service_role", () => {
    const decision = runHook({
      tool_name: "Write",
      tool_input: { file_path: "src/lib/courses.ts", content: "export const listCourses = () => [];" },
    });
    expect(decision).toBeNull();
  });
});

describe("check-rls.js — migraciones nuevas sin RLS", () => {
  it("bloquea CREATE TABLE sin ENABLE ROW LEVEL SECURITY en el mismo archivo", () => {
    const decision = runHook({
      tool_name: "Write",
      tool_input: { file_path: "supabase/migrations/0099_notas.sql", content: "create table notas (id uuid primary key);" },
    });
    expect(decision?.hookSpecificOutput?.permissionDecision).toBe("deny");
  });

  it("permite CREATE TABLE con ENABLE ROW LEVEL SECURITY en el mismo archivo", () => {
    const decision = runHook({
      tool_name: "Write",
      tool_input: {
        file_path: "supabase/migrations/0099_notas.sql",
        content: "create table notas (id uuid primary key);\nalter table notas enable row level security;",
      },
    });
    expect(decision).toBeNull();
  });

  it("no bloquea un Edit sobre una migracion (solo ve el fragmento, no el archivo completo)", () => {
    const decision = runHook({
      tool_name: "Edit",
      tool_input: {
        file_path: "supabase/migrations/0099_notas.sql",
        old_string: "-- TODO",
        new_string: "create table notas (id uuid primary key);",
      },
    });
    expect(decision).toBeNull();
  });
});
