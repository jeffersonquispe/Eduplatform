import { createClient } from "@supabase/supabase-js";
import { test as setup } from "@playwright/test";

// Las specs dejan inscripciones y resenas de las cuentas fijas de e2e-fixtures.sql (el estado se arrastra
// entre tests), asi que una segunda corrida sobre la misma base fallaria. Esto las borra antes de empezar.
// Necesita SUPABASE_TEST_SERVICE_ROLE_KEY (secreto de CI; en local, exportala o corre e2e-fixtures.sql a mano).

const E2E_STUDENTS = ["11111111-e2e0-0000-0000-000000000003", "22222222-e2e0-0000-0000-000000000004"];

setup("limpiar inscripciones y resenas de las cuentas E2E", async () => {
  const url = process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
  if (!url || !key) {
    if (process.env.CI) throw new Error("Falta SUPABASE_TEST_SERVICE_ROLE_KEY para limpiar los datos E2E.");
    console.warn("SUPABASE_TEST_SERVICE_ROLE_KEY no definida: no se limpian los datos E2E previos.");
    return;
  }
  const admin = createClient(url, key, { auth: { persistSession: false } });
  for (const table of ["reviews", "enrollments"]) {
    const { error } = await admin.from(table).delete().in("student_id", E2E_STUDENTS);
    if (error) throw new Error(`No se pudo limpiar ${table}: ${error.message}`);
  }
});
