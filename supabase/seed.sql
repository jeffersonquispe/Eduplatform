-- Datos de ejemplo SOLO PARA DESARROLLO: 2 instructores, 3 estudiantes y 10 cursos publicados con resenas.
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
  ('d0000000-0000-0000-0000-000000000002'::uuid, 'estudiante@demo.local', 'student',    'Diego Paredes'),
  ('d0000000-0000-0000-0000-000000000003'::uuid, 'instructor2@demo.local', 'instructor', 'Mateo Vargas'),
  ('d0000000-0000-0000-0000-000000000004'::uuid, 'estudiante2@demo.local', 'student',    'Lucia Fernandez'),
  ('d0000000-0000-0000-0000-000000000005'::uuid, 'estudiante3@demo.local', 'student',    'Andres Quispe')
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

update public.profiles
set bio = 'Ingeniero y formador en IA aplicada: ayuda a equipos no tecnicos a adoptar modelos de lenguaje con criterio y seguridad.'
where id = 'd0000000-0000-0000-0000-000000000003';

-- Los cursos nacen en borrador y se publican al final para pasar la validacion de publicacion.
insert into public.courses (id, instructor_id, category_id, title, description) values
  ('d1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   (select id from public.categories where slug = 'marketing-digital'),
   'SEO para negocios locales',
   'Aprende a posicionar tu negocio en Google: investigacion de palabras clave, SEO tecnico y contenido que convierte.'),
  ('d1000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001',
   (select id from public.categories where slug = 'ia-aplicada-al-marketing'),
   'Automatiza tu marketing con IA',
   'Usa asistentes y agentes de inteligencia artificial para crear contenido, segmentar audiencias y automatizar campanas.'),
  ('d1000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001',
   (select id from public.categories where slug = 'marketing-digital'),
   'Publicidad en Meta Ads desde cero',
   'Disena, lanza y optimiza campanas en Facebook e Instagram con presupuestos pequenos y medicion clara.'),
  ('d1000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001',
   (select id from public.categories where slug = 'marketing-digital'),
   'Email marketing y automatizacion',
   'Construye tu lista, escribe correos que se abren y automatiza secuencias de bienvenida y recuperacion.'),
  ('d1000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001',
   (select id from public.categories where slug = 'marketing-digital'),
   'Analitica web con GA4',
   'Mide lo que importa: eventos, conversiones y embudos para decidir con datos y no con intuicion.'),
  ('d1000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000003',
   (select id from public.categories where slug = 'inteligencia-artificial'),
   'Introduccion a la IA generativa',
   'Entiende como funcionan los modelos de lenguaje, sus limites y como usarlos con criterio en el trabajo.'),
  ('d1000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000003',
   (select id from public.categories where slug = 'inteligencia-artificial'),
   'Prompting avanzado para equipos',
   'Tecnicas para obtener resultados consistentes: roles, ejemplos, cadenas de pasos y plantillas reutilizables.'),
  ('d1000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000003',
   (select id from public.categories where slug = 'ia-aplicada-al-marketing'),
   'Contenido para redes con IA',
   'Planifica un calendario editorial y produce piezas de calidad con asistentes de IA sin perder tu voz de marca.'),
  ('d1000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000003',
   (select id from public.categories where slug = 'ia-aplicada-al-marketing'),
   'Chatbots de atencion con IA',
   'Disena un asistente que responde a clientes, deriva casos complejos y mejora con el uso.'),
  ('d1000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000001',
   (select id from public.categories where slug = 'ia-aplicada-al-marketing'),
   'Segmentacion de clientes con IA',
   'Agrupa audiencias a partir de datos propios y personaliza mensajes sin necesitar un equipo de datos.');

insert into public.sections (id, course_id, title, position) values
  ('d2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Fundamentos del SEO', 1),
  ('d2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'Optimizacion en la pagina', 2),
  ('d2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000002', 'Primeros pasos con IA', 1),
  ('d2000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002', 'Automatizacion de campanas', 2),
  ('d2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000003', 'Estructura de una campana', 1),
  ('d2000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000003', 'Creatividades que convierten', 2),
  ('d2000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000004', 'Tu lista de correo', 1),
  ('d2000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000004', 'Secuencias automaticas', 2),
  ('d2000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000005', 'Configuracion', 1),
  ('d2000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000005', 'Informes', 2),
  ('d2000000-0000-0000-0000-000000000011', 'd1000000-0000-0000-0000-000000000006', 'Conceptos clave', 1),
  ('d2000000-0000-0000-0000-000000000012', 'd1000000-0000-0000-0000-000000000006', 'Uso responsable', 2),
  ('d2000000-0000-0000-0000-000000000013', 'd1000000-0000-0000-0000-000000000007', 'Tecnicas', 1),
  ('d2000000-0000-0000-0000-000000000014', 'd1000000-0000-0000-0000-000000000007', 'Flujos de trabajo', 2),
  ('d2000000-0000-0000-0000-000000000015', 'd1000000-0000-0000-0000-000000000008', 'Estrategia', 1),
  ('d2000000-0000-0000-0000-000000000016', 'd1000000-0000-0000-0000-000000000008', 'Produccion', 2),
  ('d2000000-0000-0000-0000-000000000017', 'd1000000-0000-0000-0000-000000000009', 'Diseno del asistente', 1),
  ('d2000000-0000-0000-0000-000000000018', 'd1000000-0000-0000-0000-000000000009', 'Puesta en marcha', 2),
  ('d2000000-0000-0000-0000-000000000019', 'd1000000-0000-0000-0000-000000000010', 'Datos de partida', 1),
  ('d2000000-0000-0000-0000-000000000020', 'd1000000-0000-0000-0000-000000000010', 'Segmentos accionables', 2);

insert into public.lessons (id, section_id, title, position) values
  ('d3000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001', 'Como funciona un buscador', 1),
  ('d3000000-0000-0000-0000-000000000002', 'd2000000-0000-0000-0000-000000000001', 'Investigacion de palabras clave', 2),
  ('d3000000-0000-0000-0000-000000000003', 'd2000000-0000-0000-0000-000000000002', 'Titulos y metadescripciones', 1),
  ('d3000000-0000-0000-0000-000000000004', 'd2000000-0000-0000-0000-000000000003', 'Que puede hacer la IA por tu marca', 1),
  ('d3000000-0000-0000-0000-000000000005', 'd2000000-0000-0000-0000-000000000003', 'Escribir buenos prompts de marketing', 2),
  ('d3000000-0000-0000-0000-000000000006', 'd2000000-0000-0000-0000-000000000004', 'Un agente que responde a tus leads', 1),
  ('d3000000-0000-0000-0000-000000000007', 'd2000000-0000-0000-0000-000000000005', 'Objetivos y audiencias', 1),
  ('d3000000-0000-0000-0000-000000000008', 'd2000000-0000-0000-0000-000000000005', 'Presupuesto y puja', 2),
  ('d3000000-0000-0000-0000-000000000009', 'd2000000-0000-0000-0000-000000000006', 'Formatos de anuncio', 1),
  ('d3000000-0000-0000-0000-000000000010', 'd2000000-0000-0000-0000-000000000006', 'Pruebas A/B', 2),
  ('d3000000-0000-0000-0000-000000000011', 'd2000000-0000-0000-0000-000000000007', 'Lead magnets', 1),
  ('d3000000-0000-0000-0000-000000000012', 'd2000000-0000-0000-0000-000000000007', 'Segmentacion basica', 2),
  ('d3000000-0000-0000-0000-000000000013', 'd2000000-0000-0000-0000-000000000008', 'Bienvenida', 1),
  ('d3000000-0000-0000-0000-000000000014', 'd2000000-0000-0000-0000-000000000008', 'Carrito abandonado', 2),
  ('d3000000-0000-0000-0000-000000000015', 'd2000000-0000-0000-0000-000000000009', 'Cuentas y propiedades', 1),
  ('d3000000-0000-0000-0000-000000000016', 'd2000000-0000-0000-0000-000000000009', 'Eventos y conversiones', 2),
  ('d3000000-0000-0000-0000-000000000017', 'd2000000-0000-0000-0000-000000000010', 'Embudos de conversion', 1),
  ('d3000000-0000-0000-0000-000000000018', 'd2000000-0000-0000-0000-000000000010', 'Atribucion', 2),
  ('d3000000-0000-0000-0000-000000000019', 'd2000000-0000-0000-0000-000000000011', 'Que es un modelo de lenguaje', 1),
  ('d3000000-0000-0000-0000-000000000020', 'd2000000-0000-0000-0000-000000000011', 'Alucinaciones y limites', 2),
  ('d3000000-0000-0000-0000-000000000021', 'd2000000-0000-0000-0000-000000000012', 'Privacidad de datos', 1),
  ('d3000000-0000-0000-0000-000000000022', 'd2000000-0000-0000-0000-000000000012', 'Evaluar respuestas', 2),
  ('d3000000-0000-0000-0000-000000000023', 'd2000000-0000-0000-0000-000000000013', 'Roles y contexto', 1),
  ('d3000000-0000-0000-0000-000000000024', 'd2000000-0000-0000-0000-000000000013', 'Ejemplos few-shot', 2),
  ('d3000000-0000-0000-0000-000000000025', 'd2000000-0000-0000-0000-000000000014', 'Cadenas de prompts', 1),
  ('d3000000-0000-0000-0000-000000000026', 'd2000000-0000-0000-0000-000000000014', 'Biblioteca de plantillas', 2),
  ('d3000000-0000-0000-0000-000000000027', 'd2000000-0000-0000-0000-000000000015', 'Voz de marca', 1),
  ('d3000000-0000-0000-0000-000000000028', 'd2000000-0000-0000-0000-000000000015', 'Calendario editorial', 2),
  ('d3000000-0000-0000-0000-000000000029', 'd2000000-0000-0000-0000-000000000016', 'Textos y guiones', 1),
  ('d3000000-0000-0000-0000-000000000030', 'd2000000-0000-0000-0000-000000000016', 'Revision y aprobacion', 2),
  ('d3000000-0000-0000-0000-000000000031', 'd2000000-0000-0000-0000-000000000017', 'Casos de uso', 1),
  ('d3000000-0000-0000-0000-000000000032', 'd2000000-0000-0000-0000-000000000017', 'Base de conocimiento', 2),
  ('d3000000-0000-0000-0000-000000000033', 'd2000000-0000-0000-0000-000000000018', 'Derivacion a personas', 1),
  ('d3000000-0000-0000-0000-000000000034', 'd2000000-0000-0000-0000-000000000018', 'Metricas de calidad', 2),
  ('d3000000-0000-0000-0000-000000000035', 'd2000000-0000-0000-0000-000000000019', 'Limpieza de datos', 1),
  ('d3000000-0000-0000-0000-000000000036', 'd2000000-0000-0000-0000-000000000019', 'Variables utiles', 2),
  ('d3000000-0000-0000-0000-000000000037', 'd2000000-0000-0000-0000-000000000020', 'Clustering sencillo', 1),
  ('d3000000-0000-0000-0000-000000000038', 'd2000000-0000-0000-0000-000000000020', 'Mensajes por segmento', 2);

insert into public.lesson_contents (lesson_id, body, video_url)
select l.id,
       'Contenido de ejemplo de la leccion "' || l.title || '". Sustituyelo por tu propio material.',
       null
from public.lessons l
where l.id::text like 'd3000000-%';

update public.courses set status = 'published'
where id in ('d1000000-0000-0000-0000-000000000001',
             'd1000000-0000-0000-0000-000000000002',
             'd1000000-0000-0000-0000-000000000003',
             'd1000000-0000-0000-0000-000000000004',
             'd1000000-0000-0000-0000-000000000005',
             'd1000000-0000-0000-0000-000000000006',
             'd1000000-0000-0000-0000-000000000007',
             'd1000000-0000-0000-0000-000000000008',
             'd1000000-0000-0000-0000-000000000009',
             'd1000000-0000-0000-0000-000000000010');

-- Inscripciones y resenas de ejemplo (los promedios del catalogo los mantiene un trigger).
insert into public.enrollments (student_id, course_id) values
  ('d0000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000003'),
  ('d0000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000003'),
  ('d0000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000004'),
  ('d0000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000006'),
  ('d0000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000006'),
  ('d0000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000006'),
  ('d0000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000007'),
  ('d0000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000009'),
  ('d0000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000010');

insert into public.reviews (course_id, student_id, rating, comment) values
  ('d1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 5, 'Muy practico, lo aplique en mi negocio esa misma semana.'),
  ('d1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 4, 'Claro y bien explicado.'),
  ('d1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 5, null),
  ('d1000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 4, 'Buenas ideas para empezar a automatizar.'),
  ('d1000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004', 5, 'Justo lo que buscaba.'),
  ('d1000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 5, 'Los ejemplos de anuncios son oro.'),
  ('d1000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000005', 4, null),
  ('d1000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 4, 'Buen enfoque en segmentacion.'),
  ('d1000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002', 5, 'Ahora entiendo como funcionan los modelos.'),
  ('d1000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000004', 4, 'Claro y sin tecnicismos.'),
  ('d1000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000005', 5, null),
  ('d1000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000002', 4, 'Las plantillas me ahorran horas.'),
  ('d1000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000004', 5, 'Calendario listo en una tarde.'),
  ('d1000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000005', 3, 'Util, aunque esperaba mas casos.');
