-- Busqueda de texto completo (espanol) sobre titulo y descripcion.

alter table public.courses
  add column search tsvector generated always as (
    to_tsvector('spanish'::regconfig, coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored;

create index courses_search_idx on public.courses using gin (search);

grant select (search) on table public.courses to anon, authenticated;
