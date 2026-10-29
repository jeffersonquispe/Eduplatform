-- Cuentas de prueba para los tests E2E (ya confirmadas, con contrasena conocida).
-- Todas usan el dominio @e2e-test.local para poder limpiarlas con e2e-cleanup.sql.
-- Ejecutar:  npx supabase db query --linked -f supabase/tests/e2e-fixtures.sql

delete from auth.users where email like '%@e2e-test.local';

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  crypt('E2e-Passw0rd!', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('role', u.role, 'display_name', u.name),
  now(), now(), '', '', '', '', '', ''
from (values
  ('aaaaaaaa-e2e0-0000-0000-000000000001'::uuid, 'instructor-a@e2e-test.local', 'instructor', 'Ana Instructora'),
  ('bbbbbbbb-e2e0-0000-0000-000000000002'::uuid, 'instructor-b@e2e-test.local', 'instructor', 'Beto Instructor'),
  ('11111111-e2e0-0000-0000-000000000003'::uuid, 'student-1@e2e-test.local',    'student',    'Sofia Estudiante'),
  ('22222222-e2e0-0000-0000-000000000004'::uuid, 'student-2@e2e-test.local',    'student',    'Luis Estudiante')
) as u(id, email, role, name);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
select gen_random_uuid(), id, id::text,
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users
where email like '%@e2e-test.local';

-- Cursos de prueba (se insertan en borrador y se publican al final para pasar la validacion).
insert into public.courses (id, instructor_id, category_id, title, description) values
  ('c1c1c1c1-e2e0-0000-0000-000000000001', 'aaaaaaaa-e2e0-0000-0000-000000000001',
   (select id from public.categories where slug = 'marketing-digital'),
   'SEO practico para negocios', 'Aprende posicionamiento web paso a paso con casos reales.'),
  ('c2c2c2c2-e2e0-0000-0000-000000000002', 'aaaaaaaa-e2e0-0000-0000-000000000001',
   (select id from public.categories where slug = 'ia-aplicada-al-marketing'),
   'Agentes de IA para ventas', 'Automatiza la prospeccion con agentes de inteligencia artificial.'),
  ('c3c3c3c3-e2e0-0000-0000-000000000003', 'bbbbbbbb-e2e0-0000-0000-000000000002',
   (select id from public.categories where slug = 'inteligencia-artificial'),
   'Fundamentos de prompting', 'Domina el arte de escribir prompts efectivos.'),
  ('d4d4d4d4-e2e0-0000-0000-000000000004', 'aaaaaaaa-e2e0-0000-0000-000000000001',
   (select id from public.categories where slug = 'marketing-digital'),
   'Borrador oculto', 'Este curso aun no esta publicado.');

insert into public.sections (id, course_id, title, position) values
  ('a1a1a1a1-e2e0-0000-0000-000000000001', 'c1c1c1c1-e2e0-0000-0000-000000000001', 'Fundamentos', 1),
  ('a2a2a2a2-e2e0-0000-0000-000000000002', 'c1c1c1c1-e2e0-0000-0000-000000000001', 'Tecnico', 2),
  ('a3a3a3a3-e2e0-0000-0000-000000000003', 'c2c2c2c2-e2e0-0000-0000-000000000002', 'Introduccion', 1),
  ('a4a4a4a4-e2e0-0000-0000-000000000004', 'c3c3c3c3-e2e0-0000-0000-000000000003', 'Basicos', 1),
  ('a5a5a5a5-e2e0-0000-0000-000000000005', 'd4d4d4d4-e2e0-0000-0000-000000000004', 'Unica', 1);

insert into public.lessons (id, section_id, title, position) values
  ('e1e1e1e1-e2e0-0000-0000-000000000001', 'a1a1a1a1-e2e0-0000-0000-000000000001', 'Que es el SEO', 1),
  ('e2e2e2e2-e2e0-0000-0000-000000000002', 'a1a1a1a1-e2e0-0000-0000-000000000001', 'Palabras clave', 2),
  ('e3e3e3e3-e2e0-0000-0000-000000000003', 'a2a2a2a2-e2e0-0000-0000-000000000002', 'SEO tecnico', 1),
  ('e4e4e4e4-e2e0-0000-0000-000000000004', 'a3a3a3a3-e2e0-0000-0000-000000000003', 'Que es un agente', 1),
  ('e5e5e5e5-e2e0-0000-0000-000000000005', 'a4a4a4a4-e2e0-0000-0000-000000000004', 'Anatomia de un prompt', 1),
  ('e6e6e6e6-e2e0-0000-0000-000000000006', 'a5a5a5a5-e2e0-0000-0000-000000000005', 'Leccion del borrador', 1);

insert into public.lesson_contents (lesson_id, body, video_url)
select id, 'CONTENIDO-SECRETO-' || title, 'https://example.com/video/' || position
from public.lessons where id::text like 'e_e_e_e_-e2e0-%' or id::text like 'e%e2e0%';

update public.courses set status = 'published'
where id in ('c1c1c1c1-e2e0-0000-0000-000000000001',
             'c2c2c2c2-e2e0-0000-0000-000000000002',
             'c3c3c3c3-e2e0-0000-0000-000000000003');

select email, (select role from public.profiles p where p.id = u.id) as role
from auth.users u where email like '%@e2e-test.local' order by email;
