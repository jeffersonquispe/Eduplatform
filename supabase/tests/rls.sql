-- Pruebas de RLS: cada bloque ejecuta un escenario de las specs suplantando a un rol.
-- Todo corre en una transaccion que termina en ROLLBACK: no deja datos.
-- Ejecutar:  npx supabase db query --linked -f supabase/tests/rls.sql
-- Un fallo aborta el script con un error que empieza por ASSERT/EXPECTED.

begin;

-- Las aserciones cuentan tablas completas: la base debe estar sin datos de la app.
-- Si falla, ejecuta antes supabase/tests/e2e-cleanup.sql (y despues e2e-fixtures.sql si los necesitas).
do $$ begin
  assert (select count(*) from public.profiles) = 0 and (select count(*) from public.courses) = 0,
    'PRECONDITION: la base tiene datos; ejecuta supabase/tests/e2e-cleanup.sql primero';
end $$;

create schema test;
create function test.act(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;
create function test.anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
end $$;

-- Usuarios: A y B instructores; S1 y S2 estudiantes (el rol llega por metadatos de registro).
-- A: aaaaaaaa-...01  B: bbbbbbbb-...02  S1: 11111111-...03  S2: 22222222-...04
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@test.local', '{"role":"instructor","display_name":"Ana"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'b@test.local', '{"role":"instructor","display_name":"Beto"}'),
  ('11111111-0000-0000-0000-000000000003', 's1@test.local', '{"role":"student"}'),
  ('22222222-0000-0000-0000-000000000004', 's2@test.local', '{"role":"student","role_extra":"x"}');

-- ===== user-roles =====
do $$ begin
  assert (select role from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001') = 'instructor', 'ASSERT perfil A instructor';
  assert (select role from public.profiles where id = '11111111-0000-0000-0000-000000000003') = 'student', 'ASSERT perfil S1 estudiante';
  assert (select display_name from public.profiles where id = '11111111-0000-0000-0000-000000000003') = 's1', 'ASSERT nombre por defecto';
end $$;

select test.act('11111111-0000-0000-0000-000000000003');
do $$
declare n int;
begin
  begin
    update public.profiles set role = 'instructor' where id = '11111111-0000-0000-0000-000000000003';
    raise exception 'EXPECTED_DENIED: estudiante cambio su propio rol' using errcode = 'XX999';
  exception when insufficient_privilege then null;
  end;
  update public.profiles set display_name = 'Sofia' where id = '11111111-0000-0000-0000-000000000003';
  get diagnostics n = row_count;
  assert n = 1, 'ASSERT el usuario edita su propio nombre';
  update public.profiles set display_name = 'Hack' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  assert n = 0, 'ASSERT no se edita el perfil ajeno';
end $$;
reset role;

select test.anon();
do $$ begin
  assert (select count(*) from public.profiles) = 4, 'ASSERT perfiles legibles publicamente';
  assert (select count(*) from public.categories) >= 3, 'ASSERT categorias publicas';
  begin
    perform email from auth.users limit 1;
    raise exception 'EXPECTED_DENIED: anonimo lee auth.users' using errcode = 'XX999';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- ===== course-management =====
select test.act('11111111-0000-0000-0000-000000000003');
do $$ begin
  begin
    insert into public.courses (instructor_id, title) values ('11111111-0000-0000-0000-000000000003', 'Curso de estudiante');
    raise exception 'EXPECTED_DENIED: estudiante creo un curso' using errcode = 'XX999';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

select test.act('aaaaaaaa-0000-0000-0000-000000000001');
do $$
declare cat uuid := (select id from public.categories where slug = 'marketing-digital');
begin
  insert into public.courses (id, instructor_id, category_id, title, description)
  values ('c1c1c1c1-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', cat,
          'Introduccion a SEO con IA', 'Aprende posicionamiento web con herramientas de inteligencia artificial');
  insert into public.courses (id, instructor_id, title)
  values ('c2c2c2c2-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Borrador sin terminar');
  assert (select status from public.courses where id = 'c1c1c1c1-0000-0000-0000-000000000001') = 'draft', 'ASSERT curso nace en borrador';

  -- publicar un curso incompleto se rechaza e indica que falta
  begin
    update public.courses set status = 'published' where id = 'c2c2c2c2-0000-0000-0000-000000000002';
    raise exception 'EXPECTED_DENIED: se publico un curso incompleto' using errcode = 'XX999';
  exception when check_violation then
    assert sqlerrm like '%descripcion%' and sqlerrm like '%categoria%' and sqlerrm like '%leccion%', 'ASSERT el mensaje lista lo que falta: ' || sqlerrm;
  end;

  -- c1 tiene todo salvo lecciones
  begin
    update public.courses set status = 'published' where id = 'c1c1c1c1-0000-0000-0000-000000000001';
    raise exception 'EXPECTED_DENIED: se publico sin lecciones' using errcode = 'XX999';
  exception when check_violation then null;
  end;

  insert into public.sections (id, course_id, title, position)
  values ('a5a5a5a5-0000-0000-0000-000000000001', 'c1c1c1c1-0000-0000-0000-000000000001', 'Fundamentos', 1);
  insert into public.lessons (id, section_id, title, position)
  values ('e1e1e1e1-0000-0000-0000-000000000001', 'a5a5a5a5-0000-0000-0000-000000000001', 'Que es el SEO', 1);
  insert into public.lesson_contents (lesson_id, body, video_url)
  values ('e1e1e1e1-0000-0000-0000-000000000001', 'Contenido secreto de la leccion', 'https://example.com/v');

  -- el cliente no puede fijar el promedio ni reasignar el curso
  begin
    update public.courses set rating_avg = 5 where id = 'c1c1c1c1-0000-0000-0000-000000000001';
    raise exception 'EXPECTED_DENIED: cliente fijo rating_avg' using errcode = 'XX999';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.courses set instructor_id = 'bbbbbbbb-0000-0000-0000-000000000002' where id = 'c1c1c1c1-0000-0000-0000-000000000001';
    raise exception 'EXPECTED_DENIED: cliente reasigno el curso' using errcode = 'XX999';
  exception when insufficient_privilege then null;
  end;

  update public.courses set status = 'published' where id = 'c1c1c1c1-0000-0000-0000-000000000001';
  assert (select status from public.courses where id = 'c1c1c1c1-0000-0000-0000-000000000001') = 'published', 'ASSERT publicacion valida';
end $$;
reset role;

-- otro instructor no puede tocar el curso de A
select test.act('bbbbbbbb-0000-0000-0000-000000000002');
do $$
declare n int;
begin
  update public.courses set title = 'Robado' where id = 'c1c1c1c1-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  assert n = 0, 'ASSERT otro instructor no edita el curso';
  delete from public.sections where id = 'a5a5a5a5-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  assert n = 0, 'ASSERT otro instructor no borra secciones';
  update public.lessons set title = 'Robada' where id = 'e1e1e1e1-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  assert n = 0, 'ASSERT otro instructor no edita lecciones';
  begin
    insert into public.sections (course_id, title, position) values ('c1c1c1c1-0000-0000-0000-000000000001', 'Intrusa', 9);
    raise exception 'EXPECTED_DENIED: otro instructor creo una seccion' using errcode = 'XX999';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.lesson_contents (lesson_id, body) values ('e1e1e1e1-0000-0000-0000-000000000001', 'x');
    raise exception 'EXPECTED_DENIED: otro instructor escribio contenido' using errcode = 'XX999';
  exception when insufficient_privilege or unique_violation then null;
  end;
  assert (select count(*) from public.courses where id = 'c2c2c2c2-0000-0000-0000-000000000002') = 0, 'ASSERT borrador ajeno invisible';
  assert (select count(*) from public.lesson_contents) = 0, 'ASSERT contenido ajeno invisible';
end $$;
reset role;

-- ===== course-catalog (visitante anonimo) =====
select test.anon();
do $$ begin
  assert (select count(*) from public.courses) = 1, 'ASSERT anonimo ve solo cursos publicados';
  assert (select count(*) from public.courses where id = 'c2c2c2c2-0000-0000-0000-000000000002') = 0, 'ASSERT borrador oculto';
  assert (select count(*) from public.sections) = 1 and (select count(*) from public.lessons) = 1, 'ASSERT temario publico';
  assert (select count(*) from public.courses where search @@ plainto_tsquery('spanish', 'posicionamiento')) = 1, 'ASSERT busqueda con resultados';
  assert (select count(*) from public.courses where search @@ plainto_tsquery('spanish', 'cocina')) = 0, 'ASSERT busqueda sin resultados';
  begin
    perform 1 from public.lesson_contents;
    raise exception 'EXPECTED_DENIED: anonimo lee contenido' using errcode = 'XX999';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.enrollments;
    raise exception 'EXPECTED_DENIED: anonimo lee inscripciones' using errcode = 'XX999';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.enrollments (student_id, course_id) values ('11111111-0000-0000-0000-000000000003', 'c1c1c1c1-0000-0000-0000-000000000001');
    raise exception 'EXPECTED_DENIED: anonimo se inscribio' using errcode = 'XX999';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- ===== course-enrollment =====
select test.act('11111111-0000-0000-0000-000000000003');
do $$ begin
  assert (select count(*) from public.lesson_contents) = 0, 'ASSERT no inscrito no ve contenido';
  insert into public.enrollments (student_id, course_id) values ('11111111-0000-0000-0000-000000000003', 'c1c1c1c1-0000-0000-0000-000000000001');
  begin
    insert into public.enrollments (student_id, course_id) values ('11111111-0000-0000-0000-000000000003', 'c1c1c1c1-0000-0000-0000-000000000001');
    raise exception 'EXPECTED_DENIED: inscripcion duplicada' using errcode = 'XX999';
  exception when unique_violation then null;
  end;
  begin
    insert into public.enrollments (student_id, course_id) values ('11111111-0000-0000-0000-000000000003', 'c2c2c2c2-0000-0000-0000-000000000002');
    raise exception 'EXPECTED_DENIED: inscripcion en borrador' using errcode = 'XX999';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.enrollments (student_id, course_id) values ('22222222-0000-0000-0000-000000000004', 'c1c1c1c1-0000-0000-0000-000000000001');
    raise exception 'EXPECTED_DENIED: inscribio a otro estudiante' using errcode = 'XX999';
  exception when insufficient_privilege then null;
  end;
  assert (select count(*) from public.lesson_contents) = 1, 'ASSERT inscrito ve el contenido';
  assert (select count(*) from public.enrollments) = 1, 'ASSERT estudiante ve su inscripcion';
end $$;
reset role;

select test.act('22222222-0000-0000-0000-000000000004');
do $$ begin
  assert (select count(*) from public.enrollments) = 0, 'ASSERT otro estudiante no ve inscripciones ajenas';
  assert (select count(*) from public.lesson_contents) = 0, 'ASSERT no inscrito sigue sin contenido';
end $$;
reset role;

select test.act('aaaaaaaa-0000-0000-0000-000000000001');
do $$ begin
  assert (select count(*) from public.enrollments) = 1, 'ASSERT instructor ve inscripciones de su curso';
  assert (select count(*) from public.lesson_contents) = 1, 'ASSERT instructor ve su contenido';
  begin
    insert into public.enrollments (student_id, course_id) values ('aaaaaaaa-0000-0000-0000-000000000001', 'c1c1c1c1-0000-0000-0000-000000000001');
    raise exception 'EXPECTED_DENIED: instructor se inscribio' using errcode = 'XX999';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

select test.act('bbbbbbbb-0000-0000-0000-000000000002');
do $$ begin
  assert (select count(*) from public.enrollments) = 0, 'ASSERT otro instructor no ve inscripciones';
end $$;
reset role;

-- despublicar: el inscrito conserva el acceso y el curso sale del catalogo
select test.act('aaaaaaaa-0000-0000-0000-000000000001');
update public.courses set status = 'draft' where id = 'c1c1c1c1-0000-0000-0000-000000000001';
reset role;
select test.anon();
do $$ begin
  assert (select count(*) from public.courses) = 0, 'ASSERT curso despublicado sale del catalogo';
end $$;
reset role;
select test.act('11111111-0000-0000-0000-000000000003');
do $$ begin
  assert (select count(*) from public.lesson_contents) = 1, 'ASSERT inscrito conserva acceso tras despublicar';
  assert (select count(*) from public.lessons) = 1, 'ASSERT inscrito sigue viendo el temario';
end $$;
reset role;
select test.act('aaaaaaaa-0000-0000-0000-000000000001');
update public.courses set status = 'published' where id = 'c1c1c1c1-0000-0000-0000-000000000001';
reset role;

-- ===== course-reviews =====
select test.act('22222222-0000-0000-0000-000000000004');
do $$ begin
  begin
    insert into public.reviews (course_id, student_id, rating) values ('c1c1c1c1-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000004', 4);
    raise exception 'EXPECTED_DENIED: reseno sin estar inscrito' using errcode = 'XX999';
  exception when insufficient_privilege then null;
  end;
  insert into public.enrollments (student_id, course_id) values ('22222222-0000-0000-0000-000000000004', 'c1c1c1c1-0000-0000-0000-000000000001');
end $$;
reset role;

select test.act('11111111-0000-0000-0000-000000000003');
do $$ begin
  begin
    insert into public.reviews (course_id, student_id, rating) values ('c1c1c1c1-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', 0);
    raise exception 'EXPECTED_DENIED: calificacion 0' using errcode = 'XX999';
  exception when check_violation then null;
  end;
  begin
    insert into public.reviews (course_id, student_id, rating) values ('c1c1c1c1-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', 6);
    raise exception 'EXPECTED_DENIED: calificacion 6' using errcode = 'XX999';
  exception when check_violation then null;
  end;
  insert into public.reviews (course_id, student_id, rating, comment) values ('c1c1c1c1-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', 5, 'Excelente');
  begin
    insert into public.reviews (course_id, student_id, rating) values ('c1c1c1c1-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', 4);
    raise exception 'EXPECTED_DENIED: segunda resena del mismo estudiante' using errcode = 'XX999';
  exception when unique_violation then null;
  end;
end $$;
reset role;

select test.act('22222222-0000-0000-0000-000000000004');
do $$
declare n int;
begin
  insert into public.reviews (course_id, student_id, rating) values ('c1c1c1c1-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000004', 3);
  update public.reviews set rating = 1 where student_id = '11111111-0000-0000-0000-000000000003';
  get diagnostics n = row_count;
  assert n = 0, 'ASSERT no se edita la resena ajena';
  delete from public.reviews where student_id = '11111111-0000-0000-0000-000000000003';
  get diagnostics n = row_count;
  assert n = 0, 'ASSERT no se borra la resena ajena';
end $$;
reset role;

-- promedio: resenas 5 y 3 -> 4.00 con 2 resenas
do $$ begin
  assert (select rating_avg from public.courses where id = 'c1c1c1c1-0000-0000-0000-000000000001') = 4.00, 'ASSERT promedio 4.00';
  assert (select rating_count from public.courses where id = 'c1c1c1c1-0000-0000-0000-000000000001') = 2, 'ASSERT 2 resenas';
end $$;

select test.act('22222222-0000-0000-0000-000000000004');
update public.reviews set rating = 5 where student_id = '22222222-0000-0000-0000-000000000004';
reset role;
do $$ begin
  assert (select rating_avg from public.courses where id = 'c1c1c1c1-0000-0000-0000-000000000001') = 5.00, 'ASSERT promedio tras editar';
end $$;

select test.anon();
do $$ begin
  assert (select count(*) from public.reviews) = 2, 'ASSERT resenas publicas';
end $$;
reset role;

select test.act('22222222-0000-0000-0000-000000000004');
delete from public.reviews where student_id = '22222222-0000-0000-0000-000000000004';
reset role;
do $$ begin
  assert (select rating_count from public.courses where id = 'c1c1c1c1-0000-0000-0000-000000000001') = 1, 'ASSERT conteo tras borrar';
  assert (select rating_avg from public.courses where id = 'c1c1c1c1-0000-0000-0000-000000000001') = 5.00, 'ASSERT promedio tras borrar';
end $$;

-- ===== RPC del instructor: create_lesson / reorder_* / video_url =====
select test.act('aaaaaaaa-0000-0000-0000-000000000001');
do $$
declare
  l2 uuid;
  l3 uuid;
  s2 uuid := 'a5a5a5a5-0000-0000-0000-000000000002';
begin
  l2 := public.create_lesson('a5a5a5a5-0000-0000-0000-000000000001', 'Segunda leccion', 'cuerpo', 'https://example.com/v2');
  l3 := public.create_lesson('a5a5a5a5-0000-0000-0000-000000000001', 'Tercera leccion', 'cuerpo3', '');
  assert (select position from public.lessons where id = l2) = 2, 'ASSERT create_lesson agrega al final';
  assert (select position from public.lessons where id = l3) = 3, 'ASSERT segunda lecion al final';
  assert (select body from public.lesson_contents where lesson_id = l2) = 'cuerpo', 'ASSERT create_lesson guarda el contenido';
  assert (select video_url from public.lesson_contents where lesson_id = l3) is null, 'ASSERT video vacio queda null';

  -- reordenar lecciones: la ultima pasa a primera
  perform public.reorder_lessons('a5a5a5a5-0000-0000-0000-000000000001',
    array[l3, 'e1e1e1e1-0000-0000-0000-000000000001'::uuid, l2]);
  assert (select title from public.lessons where section_id = 'a5a5a5a5-0000-0000-0000-000000000001' order by position limit 1) = 'Tercera leccion', 'ASSERT reorder_lessons aplica el orden';

  -- lista incompleta o con ids ajenos se rechaza
  begin
    perform public.reorder_lessons('a5a5a5a5-0000-0000-0000-000000000001', array[l3]);
    raise exception 'EXPECTED_DENIED: reorden incompleto' using errcode = 'XX999';
  exception when check_violation then null;
  end;

  -- reordenar secciones
  insert into public.sections (id, course_id, title, position) values (s2, 'c1c1c1c1-0000-0000-0000-000000000001', 'Avanzado', 2);
  perform public.reorder_sections('c1c1c1c1-0000-0000-0000-000000000001', array[s2, 'a5a5a5a5-0000-0000-0000-000000000001'::uuid]);
  assert (select title from public.sections where course_id = 'c1c1c1c1-0000-0000-0000-000000000001' order by position limit 1) = 'Avanzado', 'ASSERT reorder_sections aplica el orden';

  -- enlaces de video no http(s) se rechazan
  begin
    perform public.create_lesson('a5a5a5a5-0000-0000-0000-000000000001', 'Mala', '', 'javascript:alert(1)');
    raise exception 'EXPECTED_DENIED: video_url javascript' using errcode = 'XX999';
  exception when check_violation then null;
  end;
end $$;
reset role;

select test.act('bbbbbbbb-0000-0000-0000-000000000002');
do $$ begin
  begin
    perform public.create_lesson('a5a5a5a5-0000-0000-0000-000000000001', 'Intrusa', '', null);
    raise exception 'EXPECTED_DENIED: otro instructor creo una leccion' using errcode = 'XX999';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.reorder_sections('c1c1c1c1-0000-0000-0000-000000000001', array['a5a5a5a5-0000-0000-0000-000000000001'::uuid]);
    raise exception 'EXPECTED_DENIED: otro instructor reordeno' using errcode = 'XX999';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.reorder_lessons('a5a5a5a5-0000-0000-0000-000000000001', array[]::uuid[]);
    raise exception 'EXPECTED_DENIED: otro instructor reordeno lecciones' using errcode = 'XX999';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

select test.anon();
do $$ begin
  begin
    perform public.create_lesson('a5a5a5a5-0000-0000-0000-000000000001', 'Anonima', '', null);
    raise exception 'EXPECTED_DENIED: anonimo ejecuto create_lesson' using errcode = 'XX999';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- ===== cancelar inscripcion =====
select test.act('11111111-0000-0000-0000-000000000003');
delete from public.enrollments where course_id = 'c1c1c1c1-0000-0000-0000-000000000001';
do $$ begin
  assert (select count(*) from public.lesson_contents) = 0, 'ASSERT sin inscripcion se pierde el acceso';
end $$;
reset role;

-- ===== funciones auxiliares: permisos de ejecucion (task 2.6) =====
do $$ begin
  assert has_function_privilege('anon', 'private.is_enrolled(uuid)', 'execute'), 'ASSERT anon ejecuta is_enrolled (lo necesitan las politicas)';
  assert has_function_privilege('authenticated', 'private.owns_course(uuid)', 'execute'), 'ASSERT authenticated ejecuta owns_course (lo necesitan las politicas)';
  assert not has_function_privilege('anon', 'public.handle_new_user()', 'execute'), 'ASSERT anon no ejecuta handle_new_user';
  assert not has_function_privilege('authenticated', 'public.refresh_course_rating()', 'execute'), 'ASSERT authenticated no ejecuta refresh_course_rating';
  assert not has_function_privilege('authenticated', 'public.validate_course_publish()', 'execute'), 'ASSERT authenticated no ejecuta validate_course_publish';
  -- los helpers ya no estan en el esquema expuesto por la API
  assert to_regprocedure('public.is_enrolled(uuid)') is null and to_regprocedure('public.owns_course(uuid)') is null, 'ASSERT helpers fuera de public';
end $$;

rollback;

select 'RLS TESTS PASSED' as result;
