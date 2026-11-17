#!/usr/bin/env node
// PreToolUse hook (Write|Edit): blocks edits to .env files and content that looks like an API key/secret.

let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0); // malformed input: don't block on our own parsing failure
  }

  const toolInput = input.tool_input || {};
  const filePath = toolInput.file_path || "";
  const content = [toolInput.content, toolInput.new_string, toolInput.old_string]
    .filter((v) => typeof v === "string")
    .join("\n");

  const normPath = filePath.replace(/\\/g, "/");
  const base = normPath.split("/").pop() || "";

  const SECRET_PATTERNS = [
    /AKIA[0-9A-Z]{16}/, // AWS access key
    /sb_service_role_[A-Za-z0-9_-]+/, // Supabase service_role key
    /sk_live_[0-9a-zA-Z]{20,}/, // Stripe live secret key
    /sk-[A-Za-z0-9]{20,}/, // generic "sk-" style key (OpenAI-style, etc.)
    /ghp_[A-Za-z0-9]{30,}/, // GitHub personal access token
    /AIza[0-9A-Za-z_-]{30,}/, // Google API key
    /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, // JWT-shaped token
    /\b[A-Za-z0-9_]*(?:API|SECRET|TOKEN|KEY)[A-Za-z0-9_]*\s*[:=]\s*["']?[A-Za-z0-9_.-]{16,}["']?/i, // *_KEY = <long value>
  ];

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

  const isEnvFile = /^\.env(\..+)?$/.test(base) && base !== ".env.example";
  if (isEnvFile) {
    block(
      `Bloqueado por hook de seguridad: "${filePath}" es un archivo .env que puede contener secretos reales. ` +
        `Este repo solo permite editar ".env.example" (plantilla sin valores reales); variables reales van en ` +
        "tu .env.local / .env.test.local locales y gitignored, fuera del control de este agente."
    );
  }

  for (const pattern of SECRET_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      block(
        `Bloqueado por hook de seguridad: el contenido a escribir en "${filePath || "(sin ruta)"}" parece contener ` +
          `una API key o secreto (patrón detectado: "${match[0].slice(0, 24)}..."). Según CLAUDE.md, las claves ` +
          "reales (service_role, tokens de proveedores, etc.) nunca deben vivir en el código del repo."
      );
    }
  }

  process.exit(0);
});
