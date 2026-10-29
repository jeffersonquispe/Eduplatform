-- Operaciones compuestas del instructor. Todas son SECURITY INVOKER: RLS sigue decidiendo quien puede.

-- Un enlace de video solo puede ser http(s); evita esquemas como javascript: al renderizarlo.
alter table public.lesson_contents
  add constraint lesson_contents_video_url_http
  check (video_url is null or video_url ~* '^https?://');

-- Crea la leccion y su contenido en una sola transaccion, al final de la seccion.
create function public.create_lesson(
  p_section_id uuid,
  p_title text,
  p_body text default '',
  p_video_url text default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  new_id uuid;
  next_pos integer;
begin
  select coalesce(max(position), 0) + 1 into next_pos
  from public.lessons where section_id = p_section_id;

  insert into public.lessons (section_id, title, position)
  values (p_section_id, p_title, next_pos)
  returning id into new_id;

  insert into public.lesson_contents (lesson_id, body, video_url)
  values (new_id, coalesce(p_body, ''), nullif(btrim(coalesce(p_video_url, '')), ''));

  return new_id;
end;
$$;

-- Reordena secciones: recibe TODOS los ids de las secciones del curso en el orden nuevo.
create function public.reorder_sections(p_course_id uuid, p_section_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.owns_course(p_course_id) then
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

-- Reordena lecciones de una seccion con la misma regla.
create function public.reorder_lessons(p_section_id uuid, p_lesson_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_course uuid;
begin
  select course_id into v_course from public.sections where id = p_section_id;
  if v_course is null or not public.owns_course(v_course) then
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

revoke all on function
  public.create_lesson(uuid, text, text, text),
  public.reorder_sections(uuid, uuid[]),
  public.reorder_lessons(uuid, uuid[])
from public, anon, authenticated;

grant execute on function
  public.create_lesson(uuid, text, text, text),
  public.reorder_sections(uuid, uuid[]),
  public.reorder_lessons(uuid, uuid[])
to authenticated;
