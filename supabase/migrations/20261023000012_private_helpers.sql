-- Las funciones auxiliares de RLS no deben ser invocables por la API (/rest/v1/rpc/...).
-- Se mueven a un esquema `private`, que PostgREST no expone. Las politicas siguen funcionando
-- porque referencian a las funciones por su OID, no por nombre.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

alter function public.is_enrolled(uuid) set schema private;
alter function public.owns_course(uuid) set schema private;

-- Las funciones plpgsql resuelven los nombres al ejecutarse: hay que actualizar las que las llaman.
create or replace function public.reorder_sections(p_course_id uuid, p_section_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not private.owns_course(p_course_id) then
    raise exception 'No tienes permiso para reordenar este curso' using errcode = 'insufficient_privilege';
  end if;

  if cardinality(p_section_ids) <> (select count(*) from public.sections where course_id = p_course_id)
     or exists (
       select 1 from unnest(p_section_ids) as x(id)
       where not exists (select 1 from public.sections s where s.id = x.id and s.course_id = p_course_id)
     )
     or (select count(distinct id) from unnest(p_section_ids) as y(id)) <> cardinality(p_section_ids)
  then
    raise exception 'La lista de secciones no coincide con las del curso' using errcode = 'check_violation';
  end if;

  update public.sections s
  set position = o.ord
  from unnest(p_section_ids) with ordinality as o(id, ord)
  where s.id = o.id and s.course_id = p_course_id;
end;
$$;

create or replace function public.reorder_lessons(p_section_id uuid, p_lesson_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_course uuid;
begin
  select course_id into v_course from public.sections where id = p_section_id;
  if v_course is null or not private.owns_course(v_course) then
    raise exception 'No tienes permiso para reordenar esta seccion' using errcode = 'insufficient_privilege';
  end if;

  if cardinality(p_lesson_ids) <> (select count(*) from public.lessons where section_id = p_section_id)
     or exists (
       select 1 from unnest(p_lesson_ids) as x(id)
       where not exists (select 1 from public.lessons l where l.id = x.id and l.section_id = p_section_id)
     )
     or (select count(distinct id) from unnest(p_lesson_ids) as y(id)) <> cardinality(p_lesson_ids)
  then
    raise exception 'La lista de lecciones no coincide con las de la seccion' using errcode = 'check_violation';
  end if;

  update public.lessons l
  set position = o.ord
  from unnest(p_lesson_ids) with ordinality as o(id, ord)
  where l.id = o.id and l.section_id = p_section_id;
end;
$$;
