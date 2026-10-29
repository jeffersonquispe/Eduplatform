-- Resenas: solo estudiantes inscritos, una por curso, nunca del propio instructor.
-- rating_avg / rating_count de `courses` se mantienen por trigger.

create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, student_id)
);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

alter table public.reviews enable row level security;

create policy "reviews_select" on public.reviews
  for select using (
    student_id = auth.uid()
    or exists (select 1 from public.courses c where c.id = reviews.course_id and c.status = 'published')
  );

create policy "reviews_insert_enrolled" on public.reviews
  for insert to authenticated
  with check (
    student_id = auth.uid()
    and public.is_enrolled(course_id)
    and not public.owns_course(course_id)
  );

create policy "reviews_update_own" on public.reviews
  for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy "reviews_delete_own" on public.reviews
  for delete to authenticated
  using (student_id = auth.uid());

revoke all on table public.reviews from anon, authenticated;
grant select on table public.reviews to anon, authenticated;
grant insert (course_id, student_id, rating, comment) on table public.reviews to authenticated;
grant update (rating, comment) on table public.reviews to authenticated;
grant delete on table public.reviews to authenticated;

create function public.refresh_course_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid := coalesce(new.course_id, old.course_id);
begin
  update public.courses c
  set rating_avg = coalesce((select round(avg(r.rating), 2) from public.reviews r where r.course_id = target), 0),
      rating_count = (select count(*) from public.reviews r where r.course_id = target)
  where c.id = target;
  return null;
end;
$$;

revoke all on function public.refresh_course_rating() from public, anon, authenticated;

create trigger reviews_refresh_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_course_rating();
