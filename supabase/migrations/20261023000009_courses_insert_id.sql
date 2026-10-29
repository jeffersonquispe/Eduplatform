-- Permite al cliente aportar el id (UUID) al crear un curso, como ya ocurre con secciones y lecciones.
-- Un id repetido solo produce un error de clave duplicada.

grant insert (id) on table public.courses to authenticated;
