-- Contenido de las lecciones, separado de `lessons` porque RLS filtra filas y no columnas:
-- el temario (titulos) es publico; el contenido, solo para inscritos y propietario.

create table public.lesson_contents (
  lesson_id uuid primary key references public.lessons (id) on delete cascade,
  body      text not null default '',
  video_url text
);

alter table public.lesson_contents enable row level security;

create policy "lesson_contents_select" on public.lesson_contents
  for select to authenticated
  using (exists (
    select 1 from public.lessons l join public.sections s on s.id = l.section_id
    where l.id = lesson_contents.lesson_id
      and (public.is_enrolled(s.course_id) or public.owns_course(s.course_id))
  ));

create policy "lesson_contents_insert_owner" on public.lesson_contents
  for insert to authenticated
  with check (exists (
    select 1 from public.lessons l join public.sections s on s.id = l.section_id
    where l.id = lesson_contents.lesson_id and public.owns_course(s.course_id)
  ));

create policy "lesson_contents_update_owner" on public.lesson_contents
  for update to authenticated
  using (exists (
    select 1 from public.lessons l join public.sections s on s.id = l.section_id
    where l.id = lesson_contents.lesson_id and public.owns_course(s.course_id)))
  with check (exists (
    select 1 from public.lessons l join public.sections s on s.id = l.section_id
    where l.id = lesson_contents.lesson_id and public.owns_course(s.course_id)));

create policy "lesson_contents_delete_owner" on public.lesson_contents
  for delete to authenticated
  using (exists (
    select 1 from public.lessons l join public.sections s on s.id = l.section_id
    where l.id = lesson_contents.lesson_id and public.owns_course(s.course_id)));

revoke all on table public.lesson_contents from anon, authenticated;
grant select, insert, update, delete on table public.lesson_contents to authenticated;
