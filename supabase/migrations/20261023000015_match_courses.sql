-- Busqueda semantica: cursos publicados mas parecidos a un vector de consulta (distancia coseno).
-- La llama la Edge Function `search-courses`, que convierte la frase del usuario en ese vector.
--
-- Es SECURITY DEFINER porque `courses.embedding` no tiene grant de lectura para anon/authenticated
-- (RLS filtra filas, no columnas). A cambio, la funcion hace de barrera por si sola:
--   * solo devuelve cursos publicados (el dueno de la funcion se salta RLS, asi que el filtro es explicito);
--   * solo devuelve columnas publicas: nunca el vector, el estado ni datos de inscripciones.

create function public.match_courses(
  query_embedding public.vector(384),
  match_count     integer default 10
)
returns table (
  id                     uuid,
  title                  text,
  description            text,
  rating_avg             numeric,
  rating_count           integer,
  category_slug          text,
  category_name          text,
  instructor_id          uuid,
  instructor_display_name text,
  similarity             double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.title,
    c.description,
    c.rating_avg,
    c.rating_count,
    cat.slug,
    cat.name,
    p.id,
    p.display_name,
    1 - (c.embedding operator(public.<=>) query_embedding) as similarity
  from public.courses c
  left join public.categories cat on cat.id = c.category_id
  left join public.profiles p on p.id = c.instructor_id
  where c.status = 'published'
    and c.embedding is not null
  order by c.embedding operator(public.<=>) query_embedding
  limit least(greatest(match_count, 1), 20);
$$;

-- Es publica a proposito (el catalogo lo ve cualquiera), a diferencia de los helpers de `private`.
revoke all on function public.match_courses(public.vector, integer) from public, anon, authenticated;
grant execute on function public.match_courses(public.vector, integer) to anon, authenticated;
