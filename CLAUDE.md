# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"plataforma-cursos": a course platform (instructors create/publish courses; students browse, enroll, learn, review). Next.js 16 (App Router) + React 19 + Tailwind 4 + Supabase (Postgres, Auth, RLS). UI copy, comments and identifiers in routes are in Spanish (`/cursos`, `/mis-cursos`, `/aprender`, `/instructor`, `/registro`).

`AGENTS.md` warns that this Next.js version has breaking changes (e.g. `src/proxy.ts` replaces `middleware.ts`). Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code.

## Commands

```bash
npm run dev          # dev server (localhost:3000)
npm run build
npm run lint         # eslint
npx playwright test                       # e2e; starts its own dev server on port 3100
npx playwright test e2e/auth.spec.ts      # single spec file
npx playwright test -g "test name"        # single test by title
```

Node >= 22. Env: copy `.env.example` to `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Only the anon key is ever used; never put `service_role` in app code.

E2E tests run serially (1 worker) against the real Supabase project in `.env.local`, using accounts seeded by `supabase/tests/e2e-fixtures.sql` (credentials in `e2e/helpers.ts`); `supabase/tests/e2e-cleanup.sql` removes them. SQL tests `supabase/tests/rls.sql` and `rls_enabled.sql` check RLS scenarios and that every `public` table has RLS enabled. Schema lives in `supabase/migrations/` (apply with the Supabase CLI).

## Architecture

**Authorization lives in the database (RLS).** The browser/server use the anon key plus the user's JWT, so RLS is the only real barrier. Server actions and pages check roles only to give clear messages and skip useless calls; do not treat those checks as security. When adding a table, enable RLS in its migration and write policies; update `rls.sql` tests.

Key design decisions (full rationale in `openspec/changes/add-course-platform/design.md` and per-capability specs in `.../specs/`):
- `lessons` (title/position, public for published courses) is split from `lesson_contents` (body/video_url, enrolled users + owner only), because RLS filters rows, not columns.
- `profiles.role` (`instructor` | `student`) is set at signup by a trigger on `auth.users`; `UPDATE` on `role` is revoked from `authenticated`.
- `SECURITY DEFINER` helpers (`is_enrolled`, `owns_course`) avoid RLS recursion between tables.
- Publishing is validated by a DB trigger on `courses` (rejects `published` without title/description/category/lesson). Actions surface its message when it starts with "No se puede publicar".
- `courses.rating_avg/rating_count` are maintained by triggers on `reviews`; catalog search uses a generated `tsvector` column (`spanish`).
- Ordering uses integer `position`; reordering and lesson creation go through RPCs (`reorder_sections`, `reorder_lessons`, `create_lesson`) so they are transactional.

**Next.js layer** (`src/`):
- `src/proxy.ts` -> `lib/supabase/proxy.ts#updateSession`: refreshes the session via `getClaims()` and redirects unauthenticated users away from `/instructor`, `/mis-cursos`, `/aprender` (optimistic check only).
- `lib/supabase/server.ts` (cookie-based, server components/actions) and `client.ts` (browser); typed with `lib/database.types.ts`.
- `lib/auth.ts`: `getCurrentUser()` (React `cache`d, one query per request), `requireRole(role, next)` for protected pages, `safeNextPath()` to prevent open redirects on `?next=`.
- `app/actions/*.ts`: server actions (`auth`, `courses`, `enrollments`, `reviews`) returning `ActionState = { error?, ok? }`, used with `components/action-form.tsx`. Pattern: validate input -> run query with the user's session -> if an update/delete returns no rows treat it as "not allowed" (RLS filtered it) -> `revalidatePath`.
- Data-reading helpers: `lib/courses.ts` (catalog), `lib/learning.ts` (enrolled learning view).
