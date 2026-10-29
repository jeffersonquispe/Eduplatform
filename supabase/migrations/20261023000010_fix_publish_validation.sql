-- Corrige la validacion de publicacion: `array || 'literal'` es ambiguo en Postgres, se usa array_append.

create or replace function public.validate_course_publish()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  missing text[] := '{}';
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    if btrim(new.title) = '' then missing := array_append(missing, 'titulo'); end if;
    if btrim(new.description) = '' then missing := array_append(missing, 'descripcion'); end if;
    if new.category_id is null then missing := array_append(missing, 'categoria'); end if;
    if not exists (
      select 1 from public.sections s join public.lessons l on l.section_id = s.id
      where s.course_id = new.id
    ) then
      missing := array_append(missing, 'al menos una leccion');
    end if;

    if cardinality(missing) > 0 then
      raise exception 'No se puede publicar el curso, falta: %', array_to_string(missing, ', ')
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;
