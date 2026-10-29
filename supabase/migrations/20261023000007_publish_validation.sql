-- Un curso solo puede pasar a `published` si tiene titulo, descripcion, categoria y al menos una leccion.
-- La regla vive en la base de datos para que no dependa del cliente.

create function public.validate_course_publish()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  missing text[] := '{}';
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    if btrim(new.title) = '' then missing := missing || 'titulo'; end if;
    if btrim(new.description) = '' then missing := missing || 'descripcion'; end if;
    if new.category_id is null then missing := missing || 'categoria'; end if;
    if not exists (
      select 1 from public.sections s join public.lessons l on l.section_id = s.id
      where s.course_id = new.id
    ) then
      missing := missing || 'al menos una leccion';
    end if;

    if cardinality(missing) > 0 then
      raise exception 'No se puede publicar el curso, falta: %', array_to_string(missing, ', ')
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.validate_course_publish() from public, anon, authenticated;

create trigger courses_validate_publish
  before insert or update on public.courses
  for each row execute function public.validate_course_publish();
