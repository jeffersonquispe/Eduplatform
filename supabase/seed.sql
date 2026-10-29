-- Datos de ejemplo SOLO PARA DESARROLLO: 1 instructor, 1 estudiante y 2 cursos publicados.
-- Las cuentas tienen una contrasena conocida (Demo-Passw0rd!): no cargar este archivo en produccion.
--
-- Local:  se carga solo con `supabase db reset`.
-- Nube:   npx supabase db query --linked -f supabase/seed.sql
-- Es idempotente: borra y recrea las cuentas @demo.local (y sus cursos, en cascada).

delete from auth.users where email like '%@demo.local';

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  crypt('Demo-Passw0rd!', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('role', u.role, 'display_name', u.name),
  now(), now(), '', '', '', '', '', ''
from (values
  ('d0000000-0000-0000-0000-000000000001'::uuid, 'instructor@demo.local', 'instructor', 'Camila Rojas'),
  ('d0000000-0000-0000-0000-000000000002'::uuid, 'estudiante@demo.local', 'student',    'Diego Paredes')
) as u(id, email, role, name);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
select gen_random_uuid(), id, id::text,
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users
where email like '%@demo.local';

update public.profiles
set bio = 'Consultora de marketing digital con 10 anos ayudando a pymes a crecer con SEO, anuncios y automatizacion con IA.'
where id = 'd0000000-0000-0000-0000-000000000001';

-- Los cursos nacen en borrador y se publican al final para pasar la validacion de publicacion.
insert into public.courses (id, instructor_id, category_id, title, description) values
  ('d1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   (select id from public.categories where slug = 'marketing-digital'),
   'SEO para negocios locales',
   'Aprende a posicionar tu negocio en Google: investigacion de palabras clave, SEO tecnico y contenido que convierte.'),
  ('d1000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001',
   (select id from public.categories where slug = 'ia-aplicada-al-marketing'),
   'Automatiza tu marketing con IA',
   'Usa asistentes y agentes de inteligencia artificial para crear contenido, segmentar audiencias y automatizar campanas.');

insert into public.sections (id, course_id, title, position) values
  ('d2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Fundamentos del SEO', 1),
  ('d2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'Optimizacion en la pagina', 2),
  ('d2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000002', 'Primeros pasos con IA', 1),
  ('d2000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002', 'Automatizacion de campanas', 2);

insert into public.lessons (id, section_id, title, position) values
  ('d3000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001', 'Como funciona un buscador', 1),
  ('d3000000-0000-0000-0000-000000000002', 'd2000000-0000-0000-0000-000000000001', 'Investigacion de palabras clave', 2),
  ('d3000000-0000-0000-0000-000000000003', 'd2000000-0000-0000-0000-000000000002', 'Titulos y metadescripciones', 1),
  ('d3000000-0000-0000-0000-000000000004', 'd2000000-0000-0000-0000-000000000003', 'Que puede hacer la IA por tu marca', 1),
  ('d3000000-0000-0000-0000-000000000005', 'd2000000-0000-0000-0000-000000000003', 'Escribir buenos prompts de marketing', 2),
  ('d3000000-0000-0000-0000-000000000006', 'd2000000-0000-0000-0000-000000000004', 'Un agente que responde a tus leads', 1);

insert into public.lesson_contents (lesson_id, body, video_url)
select l.id,
       'Contenido de ejemplo de la leccion "' || l.title || '". Sustituyelo por tu propio material.',
       null
from public.lessons l
where l.id::text like 'd3000000-%';

update public.courses set status = 'published'
where id in ('d1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002');
