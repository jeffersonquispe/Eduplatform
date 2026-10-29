-- Cursos, secciones y lecciones, mas las funciones auxiliares de acceso.
-- Las funciones son plpgsql (enlace tardio) porque `enrollments` se crea despues.

create type public.course_status as enum ('draft', 'published');

create function public.is_enrolled(p_course_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1 from public.enrollments e
    where e.course_id = p_course_id and e.student_id = auth.uid()
  );
end;
$$;

create function public.owns_course(p_course_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1 from public.courses c
    where c.id = p_course_id and c.instructor_id = auth.uid()
  );
end;
$$;

revoke all on function public.is_enrolled(uuid), public.owns_course(uuid) from public, anon, authenticated;
grant execute on function public.is_enrolled(uuid), public.owns_course(uuid) to anon, authenticated;

create table public.courses (
  id            uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references public.profiles (id) on delete cascade,
  category_id   uuid references public.categories (id),
  title         text not null,
  description   text not null default '',
  status        public.course_status not null default 'draft',
  rating_avg    numeric(3, 2) not null default 0,
  rating_count  integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index courses_instructor_idx on public.courses (instructor_id);
create index courses_category_idx on public.courses (category_id) where status = 'published';

create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

create table public.sections (
  id        uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title     text not null,
  position  integer not null,
  unique (course_id, position) deferrable initially deferred
);

create table public.lessons (
  id         uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections (id) on delete cascade,
  title      text not null,
  position   integer not null,
  unique (section_id, position) deferrable initially deferred
);

alter table public.courses  enable row level security;
alter table public.sections enable row level security;
alter table public.lessons  enable row level security;

-- Cursos: publicados para todos; borradores para el propietario; un curso despublicado
-- sigue visible para quienes ya estaban inscritos.
create policy "courses_select" on public.courses
  for select using (
    status = 'published'
    or instructor_id = auth.uid()
    or public.is_enrolled(id)
  );

create policy "courses_insert_instructor" on public.courses
  for insert to authenticated
  with check (
    instructor_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor')
  );

create policy "courses_update_owner" on public.courses
  for update to authenticated
  using (instructor_id = auth.uid())
  with check (instructor_id = auth.uid());

create policy "courses_delete_owner" on public.courses
  for delete to authenticated
  using (instructor_id = auth.uid());

-- Secciones y lecciones heredan la visibilidad del curso (la subconsulta ya pasa por su RLS).
create policy "sections_select" on public.sections
  for select using (exists (select 1 from public.courses c where c.id = sections.course_id));

create policy "sections_insert_owner" on public.sections
  for insert to authenticated
  with check (exists (select 1 from public.courses c where c.id = sections.course_id and c.instructor_id = auth.uid()));

create policy "sections_update_owner" on public.sections
  for update to authenticated
  using (exists (select 1 from public.courses c where c.id = sections.course_id and c.instructor_id = auth.uid()))
  with check (exists (select 1 from public.courses c where c.id = sections.course_id and c.instructor_id = auth.uid()));

create policy "sections_delete_owner" on public.sections
  for delete to authenticated
  using (exists (select 1 from public.courses c where c.id = sections.course_id and c.instructor_id = auth.uid()));

create policy "lessons_select" on public.lessons
  for select using (exists (select 1 from public.sections s where s.id = lessons.section_id));

create policy "lessons_insert_owner" on public.lessons
  for insert to authenticated
  with check (exists (
    select 1 from public.sections s join public.courses c on c.id = s.course_id
    where s.id = lessons.section_id and c.instructor_id = auth.uid()));

create policy "lessons_update_owner" on public.lessons
  for update to authenticated
  using (exists (
    select 1 from public.sections s join public.courses c on c.id = s.course_id
    where s.id = lessons.section_id and c.instructor_id = auth.uid()))
  with check (exists (
    select 1 from public.sections s join public.courses c on c.id = s.course_id
    where s.id = lessons.section_id and c.instructor_id = auth.uid()));

create policy "lessons_delete_owner" on public.lessons
  for delete to authenticated
  using (exists (
    select 1 from public.sections s join public.courses c on c.id = s.course_id
    where s.id = lessons.section_id and c.instructor_id = auth.uid()));

-- Permisos por columna: el cliente no puede fijar el promedio ni reasignar el curso a otro instructor.
revoke all on table public.courses, public.sections, public.lessons from anon, authenticated;
grant select on table public.courses, public.sections, public.lessons to anon, authenticated;
grant insert (instructor_id, category_id, title, description) on table public.courses to authenticated;
grant update (category_id, title, description, status) on table public.courses to authenticated;
grant delete on table public.courses to authenticated;
grant insert, update, delete on table public.sections, public.lessons to authenticated;
