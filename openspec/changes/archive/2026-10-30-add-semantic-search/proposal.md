## Why

La búsqueda del catálogo solo encuentra coincidencias de palabras en título y descripción. Una persona que escribe lo que necesita con sus propias palabras ("quiero aprender a vender por redes", "machine learning") no obtiene resultados si esas palabras no aparecen literalmente en un curso. Con el catálogo ya publicado y creciendo, conviene que la búsqueda entienda el significado de la frase y no solo el texto.

## What Changes

- Cada curso guarda un **embedding** (vector de 384 dimensiones) calculado con `gte-small` a partir de su título, descripción, categoría, temario y contenido de lecciones.
- El embedding se genera **automáticamente**: la base de datos avisa a una Edge Function cuando se crea un curso o pasa a publicado.
- Nueva búsqueda por significado: la frase del visitante se convierte en embedding y se devuelven los cursos publicados más cercanos, ordenados por similitud, descartando los que no llegan a una similitud de **0.8**.
- El catálogo (`/cursos`) usa esta búsqueda cuando hay texto de búsqueda y recurre a la búsqueda de texto completo si el servicio de embeddings falla. El filtro por categoría se sigue aplicando.
- **BREAKING**: un término presente en el título de un curso ya no garantiza que el curso aparezca; depende de que su similitud alcance el umbral.
- Se agrega el curso "Deep Learning aplicado" a la base remota (dato de ejemplo, no cambia el comportamiento).

## Capabilities

### New Capabilities
- `course-embeddings`: generación automática, almacenamiento y protección del embedding de cada curso.

### Modified Capabilities
- `course-catalog`: el requisito "Búsqueda por texto" pasa a ser búsqueda por significado con umbral de similitud y respaldo de texto completo.

## Impact

- **Base de datos** (migraciones 13, 14 y 15): extensión `vector`, columna `courses.embedding` con índice HNSW, extensión `pg_net`, trigger `courses_notify_embedding`, función `match_courses`.
- **Edge Functions** nuevas: `embed-course` (usa el service role y un secreto compartido) y `search-courses` (usa la clave anon, pública).
- **Secretos**: `EMBED_COURSE_SECRET` en la función y `project_url` / `embed_course_secret` en Vault.
- **Código Next.js**: `src/lib/courses.ts` (`getPublishedCourses`) y `src/lib/embeddings.ts`.
- **Configuración**: `supabase/config.toml`, `tsconfig.json` y `eslint.config.mjs` excluyen `supabase/functions`.
- **Tests**: `e2e/catalog.spec.ts` asume búsqueda de texto y puede fallar.
- **Reglas del proyecto**: `CLAUDE.md` prohíbe `service_role` en el código de la app; aquí solo se usa dentro de una Edge Function.
