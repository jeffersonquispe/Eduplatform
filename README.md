# Plataforma de cursos de marketing digital e IA

Marketplace de cursos con dos roles: **instructores** (crean y publican cursos) y **estudiantes** (exploran, se inscriben, aprenden y reseñan). Next.js (App Router) + Supabase (Postgres, Auth y RLS).

La autorización vive en la base de datos: el navegador usa la clave pública (`anon`) y el JWT del usuario, y las políticas RLS deciden qué filas ve o modifica cada rol. La clave `service_role` no se usa en la aplicación.

## Requisitos

- **Node 22 o superior** (`nvm use 22`). `@supabase/supabase-js` necesita `WebSocket` nativo, que Node 20 no tiene.
- Un proyecto de Supabase (o `supabase start` con Docker).

## Puesta en marcha

```bash
nvm use 22
npm install
cp .env.example .env.local        # rellena la URL y la clave anon de tu proyecto
npx supabase link --project-ref <ref>
npx supabase db push              # aplica supabase/migrations
npm run dev                       # http://localhost:3000
```

> Si tu proyecto tiene activado **Confirm email** (Auth → Providers → Email), los registros nuevos exigen abrir el correo de confirmación. Para desarrollo puedes desactivarlo.

## Estructura

| Ruta | Para quién |
|---|---|
| `/`, `/cursos`, `/cursos/[id]` | Público: catálogo, búsqueda, detalle, reseñas |
| `/login`, `/registro` | Público |
| `/mis-cursos`, `/aprender/[id]/[lessonId]` | Estudiante inscrito (o instructor propietario) |
| `/instructor`, `/instructor/cursos/[id]` | Instructor: panel y editor de cursos |

El esquema está en `supabase/migrations/`. Decisiones de diseño: `openspec/changes/add-course-platform/design.md`.

## Pruebas

```bash
# Políticas RLS (la base debe estar sin datos; corre en una transacción con ROLLBACK)
npx supabase db query --linked -f supabase/tests/e2e-cleanup.sql
npx supabase db query --linked -f supabase/tests/rls.sql
npx supabase db query --linked -f supabase/tests/rls_enabled.sql

# E2E con Playwright (usa cuentas @e2e-test.local que crea el fixture)
npx playwright install chromium
npx supabase db query --linked -f supabase/tests/e2e-fixtures.sql
npm run test:e2e                  # contra el servidor de desarrollo
E2E_PROD=1 npm run test:e2e       # contra next build + next start
npx supabase db query --linked -f supabase/tests/e2e-cleanup.sql
```

`supabase/seed.sql` carga datos de ejemplo para desarrollo (cuentas `@demo.local`, contraseña conocida): **no lo cargues en producción**.

## Notas

- Las páginas dinámicas se transmiten por partes (`cacheComponents`), por lo que una URL inexistente muestra la pantalla «no encontrada» pero con estado HTTP 200.
- Tras cambiar el esquema, regenera los tipos: `npx supabase gen types typescript --linked --schema public > src/lib/database.types.ts`.
