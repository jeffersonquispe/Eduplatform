## Context

Proyecto nuevo: no hay código ni specs previas. El stack está fijado por la solicitud: Next.js (App Router) y Supabase (Postgres, Auth, RLS), con despliegue previsto en Vercel. El comportamiento exigido está en `specs/`; este documento solo cubre cómo construirlo.

La restricción central es que **la autorización vive en la base de datos**. El navegador accede a Postgres con la clave pública (anon) y el JWT del usuario, así que RLS es la única barrera real.

## Goals / Non-Goals

**Goals:**
- Modelo de datos donde cada regla de acceso de las specs se exprese como política RLS verificable.
- Interfaz que use la sesión del usuario, nunca privilegios elevados, para operaciones de usuario.
- Migraciones SQL versionadas y reproducibles.

**Non-Goals:**
- Pagos, certificados, quizzes, progreso por lección y funciones de IA.
- Alojamiento propio de video: las lecciones guardan un enlace a video externo.
- Rol de administrador y moderación de contenido.

## Decisions

### 1. Separar `lessons` de `lesson_contents`
RLS filtra filas, no columnas. El temario (título y orden) debe ser público para cursos publicados, pero el contenido solo para inscritos. Por eso:
- `lessons(id, section_id, title, position)`: lectura pública si el curso está publicado.
- `lesson_contents(lesson_id, body, video_url)`: lectura solo para inscritos y propietario.

*Alternativa descartada:* una sola tabla con una vista que oculte columnas. Es frágil, porque un error de grants o de `security_invoker` filtraría el contenido.

### 2. Rol en `profiles`, protegido por permisos de columna
`profiles(id → auth.users, role, display_name, bio, avatar_url)`. Un trigger sobre `auth.users` crea el perfil con el rol elegido en el registro. Para que nadie cambie su rol, se revoca `UPDATE` sobre `role` al rol `authenticated` y se concede solo sobre las demás columnas.

*Alternativa:* guardar el rol en `app_metadata` del JWT. Evita una consulta, pero complica el cambio de rol y el trigger de creación. Se descarta por ahora.

### 3. Funciones auxiliares `SECURITY DEFINER`
Las políticas de `lesson_contents`, `reviews` y `lessons` necesitan consultar `enrollments` y `courses`, que a su vez tienen RLS. Se usan funciones `is_enrolled(course_id)` y `owns_course(course_id)` con `SECURITY DEFINER`, `search_path` fijo y sin parámetros de usuario (usan `auth.uid()`), para evitar recursión y mantener las políticas legibles.

### 4. Matriz de políticas

| Tabla | Lectura | Escritura |
|---|---|---|
| `profiles` | pública solo nombre, bio y foto | el propio usuario, sin `role` |
| `categories` | pública | solo por migración |
| `courses` | publicados: todos; borradores: propietario | propietario con rol instructor |
| `sections`, `lessons` | curso publicado o propietario | propietario |
| `lesson_contents` | inscrito o propietario | propietario |
| `enrollments` | el estudiante y el propietario del curso | estudiante inscribe y cancela lo suyo, solo cursos publicados |
| `reviews` | curso publicado: todos | autor inscrito, no propietario; 1 por curso |

### 5. Publicación validada en la base de datos
Un trigger `BEFORE UPDATE` en `courses` rechaza el paso a `published` si faltan título, descripción, categoría o al menos una lección. Así la regla no depende del cliente.

### 6. Promedio de calificaciones denormalizado
`courses` guarda `rating_avg` y `rating_count`, actualizados por trigger al insertar, modificar o borrar reseñas (el trigger es `SECURITY DEFINER`). Evita agregaciones en cada listado del catálogo.
*Alternativa:* vista con `AVG`. Más simple, pero cara y difícil de ordenar con paginación.

### 7. Búsqueda con `tsvector`
Columna generada `search` sobre título y descripción con índice GIN, configuración `spanish`. Suficiente para el catálogo inicial; no se añade un motor externo.

### 8. Next.js: tres clientes Supabase
Con `@supabase/ssr`: cliente de servidor (cookies), cliente de navegador y *proxy/middleware* que refresca la sesión. Las páginas del catálogo se renderizan en servidor. La clave `service_role` **no se usa** en el código de la aplicación; si hiciera falta, solo en tareas de administración fuera de la app.

### 9. Orden con enteros de posición
`position` entero por sección y por lección, reordenado con una función RPC en una sola transacción. Más simple que listas enlazadas o fracciones para el volumen esperado.

## Risks / Trade-offs

- **[Política RLS mal escrita filtra datos]** → Pruebas SQL que ejecutan cada escenario de las specs como `anon`, estudiante, instructor propietario y otro instructor.
- **[Funciones `SECURITY DEFINER` mal configuradas]** → `search_path` fijo, `EXECUTE` revocado a `public` y concedido solo a los roles necesarios.
- **[Una tabla sin RLS queda abierta por olvido]** → Habilitar RLS en cada migración y una comprobación en pruebas que falle si alguna tabla de `public` no la tiene.
- **[Video externo: el enlace se puede compartir]** → Aceptado en v1; la protección real de video requeriría alojamiento con URLs firmadas, fuera de alcance.
- **[Rol elegido libremente al registrarse]** → Aceptado: cualquiera puede ser instructor. Moderar o verificar instructores queda para un cambio futuro.
- **[Promedio denormalizado puede desfasarse]** → Se actualiza solo por trigger; una prueba comprueba que coincide con el cálculo directo.
