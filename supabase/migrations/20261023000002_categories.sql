-- Categorias del catalogo. Solo se modifican por migracion.

create table public.categories (
  id   uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null
);

alter table public.categories enable row level security;

create policy "categories_select_public" on public.categories
  for select using (true);

revoke all on table public.categories from anon, authenticated;
grant select on table public.categories to anon, authenticated;

insert into public.categories (slug, name) values
  ('marketing-digital', 'Marketing digital'),
  ('inteligencia-artificial', 'Inteligencia artificial'),
  ('ia-aplicada-al-marketing', 'IA aplicada al marketing');
