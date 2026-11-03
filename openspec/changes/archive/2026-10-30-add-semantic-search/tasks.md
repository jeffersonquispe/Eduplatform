## 1. Base de datos

- [x] 1.1 Migración `20261023000013_embeddings.sql`: extensión `vector`, columna `courses.embedding vector(384)` e índice HNSW coseno; verificado con `supabase db push --linked` y 10 cursos con embedding de 384 dimensiones
- [x] 1.2 Migración `20261023000014_embedding_webhook.sql`: trigger `courses_notify_embedding` que avisa con `pg_net` al crear un curso o al pasar a publicado, sin bloquear el guardado; verificado publicando "Deep Learning aplicado" y viendo su embedding sin intervención manual
- [x] 1.3 Migración `20261023000015_match_courses.sql`: función `match_courses` con `SECURITY DEFINER`, solo publicados, solo columnas públicas y tope de 20; verificada como `anon` en una transacción revertida

## 2. Generación del embedding

- [x] 2.1 `src/lib/embeddings.ts` con `buildCourseEmbeddingText` y `getCourseEmbeddingText`; verificado con datos reales como propietario (637 caracteres con título, descripción, categoría, temario y contenido) y con `tsc`/`eslint`
- [x] 2.2 Edge Function `embed-course` (service role, secreto `x-webhook-secret`, `gte-small`); verificada con una llamada real que devolvió 200 y un vector de 384 dimensiones
- [x] 2.3 Secretos `EMBED_COURSE_SECRET` (función) y `project_url` / `embed_course_secret` (Vault) configurados; verificado con `supabase secrets list` y consultando los nombres en `vault.secrets`
- [x] 2.4 Calcular el embedding de los cursos ya publicados, de uno en uno; verificado con 10 de 10 cursos con embedding

## 3. Búsqueda

- [x] 3.1 Edge Function `search-courses` (clave anon, frase de hasta 200 caracteres, umbral `MIN_SIMILARITY = 0.8`); verificada con llamadas reales ("machine learning" devuelve 2 cursos, "cocina" devuelve ninguno, frase vacía responde 400 y GET responde 405)
- [x] 3.2 `getPublishedCourses` en `src/lib/courses.ts` usa la búsqueda por significado cuando hay texto, con respaldo de texto completo y filtro de categoría posterior; verificado con `tsc` y con `/cursos?q=machine learning` mostrando "Deep Learning aplicado"

## 4. Configuración y datos

- [x] 4.1 `supabase/config.toml` declara `verify_jwt = false` para ambas funciones, y `tsconfig.json` y `eslint.config.mjs` excluyen `supabase/functions`
- [x] 4.2 Agregar el curso "Deep Learning aplicado" (3 secciones, 7 lecciones) a la base remota; verificado con consulta: publicado y con embedding

## 5. Pendiente

- [ ] 5.1 Ejecutar `npx playwright test e2e/catalog.spec.ts` y ajustar los casos de búsqueda (`q=Borrador`, `q=posicionamiento`, `q=cocina`) al comportamiento por significado; verificar que todo el archivo pasa
- [ ] 5.2 Agregar a `supabase/tests/rls.sql` casos que comprueben que `anon` no puede leer `courses.embedding` y que `match_courses` no devuelve borradores; verificar que el script corre sin fallos
- [ ] 5.3 Documentar en `CLAUDE.md` la excepción del service role en `embed-course` y el flujo de embeddings; verificar que el archivo menciona la función, los secretos y la búsqueda semántica
