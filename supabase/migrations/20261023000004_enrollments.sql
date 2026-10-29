-- Inscripciones gratuitas. Cada estudiante ve las suyas y el instructor las de sus cursos.

create table public.enrollments (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  course_id  uuid not null references public.courses (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, course_id)
);

create index enrollments_course_idx on public.enrollments (course_id);

alter table public.enrollments enable row level security;

create policy "enrollments_select" on public.enrollments
  for select to authenticated
  using (student_id = auth.uid() or public.owns_course(course_id));

create policy "enrollments_insert_student" on public.enrollments
  for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'student')
    and exists (select 1 from public.courses c where c.id = enrollments.course_id and c.status = 'published')
  );

create policy "enrollments_delete_own" on public.enrollments
  for delete to authenticated
  using (student_id = auth.uid());

revoke all on table public.enrollments from anon, authenticated;
grant select, delete on table public.enrollments to authenticated;
grant insert (student_id, course_id) on table public.enrollments to authenticated;
