## Context

Hoy el catálogo busca con `textSearch` sobre `courses.search` (tsvector en español) desde `getPublishedCourses` en `src/lib/courses.ts`. La autorización vive en RLS y la app solo usa la clave anon. `courses` usa permisos por columna, así que una columna nueva no es legible por `anon`/`authenticated` salvo que se conceda. El motivo del cambio está en `proposal.md`.

Restricciones: el modelo debe correr sin clave externa de pago, la búsqueda debe ser pública (visitantes sin sesión) y crear o publicar un curso no puede fallar por culpa de los embeddings.

## Goals / Non-Goals

**Goals:**
- Embeddings siempre al día para cursos nuevos y publicados, sin pasos manuales del instructor.
- Búsqueda pública por significado que solo exponga datos públicos de cursos publicados.
- Degradación suave: si algo falla, el catálogo sigue funcionando.

**Non-Goals:**
- Regenerar el embedding al editar un curso ya publicado.
- Límite de peticiones por usuario o por IP.
- Búsqueda híbrida (puntaje combinado de texto y significado) o corte relativo de similitud.
- Cambiar la interfaz de `/cursos`.

## Decisions

**Modelo `gte-small` en el runtime de Edge Functions (384 dimensiones).** Viene integrado en Supabase (`Supabase.ai.Session`), no requiere clave ni servicio externo y la misma función sirve para indexar y para consultar. Alternativa: API de embeddings de un proveedor externo; descartada por costo, clave adicional y por la regla de no manejar secretos en la app. Los puntajes de `gte-small` se agrupan entre 0.75 y 0.87, lo que condiciona el umbral (ver Riesgos).

**Generación por trigger + `pg_net` + Edge Function, no desde una acción del servidor de Next.** El trigger `courses_notify_embedding` (insert, o update de `status` a publicado) envía una petición HTTP asíncrona después del commit. Así cubre cualquier camino de escritura (app, SQL, seed), el curso ya existe cuando la función lo lee y un fallo nunca revierte el guardado (el trigger captura errores y solo emite un aviso). Alternativa: llamar a la función desde `app/actions/courses.ts`; descartada porque dejaría fuera las escrituras que no pasan por la app y mezclaría el cálculo con la acción del usuario.

**Secretos en Vault y secreto compartido.** El trigger lee `project_url` y `embed_course_secret` de Vault y envía el secreto en `x-webhook-secret`; `embed-course` lo compara con `EMBED_COURSE_SECRET` y tiene `verify_jwt = false`. Sin los secretos el trigger solo avisa y el curso queda sin embedding. Los valores no se versionan.

**`embed-course` usa el service role.** Necesita escribir `embedding` (sin grant de escritura para `authenticated`) y leer el contenido de las lecciones, que RLS reserva para inscritos y propietario. Es una excepción acotada a la regla de CLAUDE.md "nunca `service_role` en el código de la app": vive en una función de servidor, la clave la inyecta Supabase y la función rechaza llamadas sin el secreto.

**Texto del curso de lo más a lo menos importante.** Título, descripción, categoría, temario y, al final, el contenido de las lecciones (300 caracteres por lección, 2000 en total), de modo que un recorte afecte solo al final. La lógica está duplicada: `buildCourseEmbeddingText` en `src/lib/embeddings.ts` y una copia en `embed-course`, porque la función Deno no puede importar código de Next. Alternativa: moverla a SQL o a un módulo compartido; pospuesta por costo.

**`match_courses` es `SECURITY DEFINER` en vez de conceder `select (embedding)`.** Conceder la columna expondría el vector por la API REST. La función se salta RLS, así que el filtro `status = 'published'` y la lista de columnas públicas están escritos dentro de ella, con `search_path` vacío y tope de 20 filas. Se concede solo a `anon` y `authenticated`. La extensión `vector` quedó en el esquema `public`, por eso la función califica `public.vector` y `public.<=>`.

**`search-courses` con clave anon y umbral absoluto 0.8.** No necesita saltarse RLS, así que no usa el service role. Convierte la frase (máx. 200 caracteres), llama a `match_courses` y filtra por `MIN_SIMILARITY = 0.8`. Alternativa: corte relativo al mejor resultado; deferida (ver Riesgos).

**Respaldo en la capa de Next.** `getPublishedCourses` llama a `search-courses` y, si falla, usa el `textSearch` previo. El filtro de categoría se aplica sobre los resultados semánticos.

**Migración con marca de tiempo.** El archivo original `0004_embeddings.sql` quedaba antes de las migraciones ya aplicadas y `db push` lo rechazaba; se renombró a `20261023000013_embeddings.sql`.

## Risks / Trade-offs

- [Un corte absoluto no separa lo relevante de lo que no lo es: con frases largas casi todo el catálogo pasa de 0.8 (10 de 11 cursos en "como entrenar redes neuronales") y con frases cortas quedan fuera cursos relevantes] → Se acepta como primera versión; el corte relativo y la búsqueda híbrida quedan como mejora.
- [Un término presente en un título puede no aparecer] → Es el cambio **BREAKING** declarado en la propuesta; el respaldo de texto solo actúa cuando la búsqueda por significado falla, no cuando devuelve vacío.
- [Los embeddings se desactualizan al editar un curso publicado] → Aceptado; solo se recalculan al crear y al publicar.
- [`search-courses` es pública y gasta cómputo del modelo; ya se vio `WORKER_RESOURCE_LIMIT` con 9 llamadas simultáneas] → Solo hay tope de largo en la frase. Llamarla desde el servidor de Next y añadir un limitador de peticiones antes de producción.
- [El embedding incluye contenido privado de lecciones porque la función lee con el service role, y un curso público se vectoriza en parte con él] → Filtración baja, pero decidida de forma explícita; se puede quitar el bloque de contenido.
- [Tests e2e de `e2e/catalog.spec.ts` asumen búsqueda de texto] → Pendiente ejecutarlos y ajustarlos.
- [Cada escritura del embedding dispara `courses_set_updated_at` y cambia `updated_at`] → Aceptado.
- [Texto del curso duplicado entre Next y la Edge Function] → Comentario cruzado en ambos archivos; riesgo de divergencia.

## Migration Plan

1. Aplicar las migraciones 13, 14 y 15 con `npx supabase db push --linked`.
2. Configurar `EMBED_COURSE_SECRET` con `npx supabase secrets set` y crear en Vault `project_url` y `embed_course_secret` con el mismo valor.
3. Desplegar `embed-course` y `search-courses` con `npx supabase functions deploy`.
4. Calcular el embedding de los cursos ya publicados llamando a `embed-course` de uno en uno (las llamadas simultáneas agotan recursos).

Reversión: eliminar el trigger `courses_notify_embedding`, `match_courses` y la columna `courses.embedding` con una migración nueva; `getPublishedCourses` vuelve a la búsqueda de texto por sí solo si `search-courses` deja de responder.

## Open Questions

- ¿Se agrega "Deep Learning aplicado" a `supabase/seed.sql`? Hoy solo existe en la base remota.
- ¿Se adopta un corte relativo respecto al mejor resultado o una búsqueda híbrida?
- ¿Se recalcula el embedding al editar título, descripción o lecciones de un curso publicado?
