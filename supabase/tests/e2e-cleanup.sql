-- Borra las cuentas de prueba E2E y, en cascada, sus perfiles, cursos, inscripciones y resenas.
-- Ejecutar:  npx supabase db query --linked -f supabase/tests/e2e-cleanup.sql

delete from auth.users where email like '%@e2e-test.local';

select
  (select count(*) from auth.users where email like '%@e2e-test.local') as cuentas_restantes,
  (select count(*) from public.courses) as cursos,
  (select count(*) from public.profiles) as perfiles;
