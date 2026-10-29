-- Falla si alguna tabla del esquema public tiene RLS desactivado.
-- Ejecutar:  npx supabase db query --linked -f supabase/tests/rls_enabled.sql

do $$
declare
  t text;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
  loop
    raise exception 'RLS desactivado en public.%', t;
  end loop;
end $$;

select count(*) as tablas_con_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p') and c.relrowsecurity;
