-- Embedding automatico: cuando se crea un curso o pasa a publicado, la base avisa a la Edge Function
-- `embed-course`, que calcula el vector con gte-small y lo guarda en `courses.embedding`.
--
-- El aviso es asincrono (pg_net): la peticion HTTP sale despues del commit, asi que el curso ya existe
-- cuando la funcion lo lee, y un fallo de la funcion nunca revierte ni retrasa el guardado del curso.
--
-- Requiere dos secretos en Vault (no van en la migracion; ver supabase/functions/embed-course/index.ts):
--   project_url          -> https://<ref>.supabase.co
--   embed_course_secret  -> el mismo valor que el secreto EMBED_COURSE_SECRET de la funcion
-- Mientras no existan, el trigger solo emite un aviso y el curso se guarda sin embedding.

create extension if not exists pg_net with schema extensions;

create function private.notify_course_embedding()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url    text;
  v_secret text;
begin
  -- El trigger solo se dispara al insertar o al tocar `status`: en una actualizacion hay que
  -- distinguir "pasa a publicado" de cualquier otro cambio de estado (p. ej. despublicar).
  if tg_op = 'UPDATE' and not (new.status = 'published' and old.status is distinct from 'published') then
    return new;
  end if;

  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'embed_course_secret';

  if v_url is null or v_secret is null then
    raise warning 'embed-course: faltan los secretos project_url / embed_course_secret en Vault; el curso % queda sin embedding', new.id;
    return new;
  end if;

  -- El cuerpo solo lleva el id: la funcion relee el curso con el service role, asi el texto
  -- que se vectoriza siempre es el del momento en que corre, no una copia antigua.
  perform net.http_post(
    url := v_url || '/functions/v1/embed-course',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
    body := jsonb_build_object('course_id', new.id),
    timeout_milliseconds := 5000
  );
  return new;
exception when others then
  -- Un fallo al avisar (red, pg_net, secreto mal formado) no debe impedir crear ni publicar el curso.
  raise warning 'embed-course: no se pudo avisar para el curso %: %', new.id, sqlerrm;
  return new;
end;
$$;

revoke all on function private.notify_course_embedding() from public, anon, authenticated;

-- `update of status` evita disparar al editar titulo o descripcion, y tambien cuando la propia
-- funcion escribe `embedding` (no toca `status`), asi que no hay bucle.
create trigger courses_notify_embedding
  after insert or update of status on public.courses
  for each row execute function private.notify_course_embedding();
