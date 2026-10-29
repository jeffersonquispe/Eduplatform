## Why

No existe todavía ningún producto: se quiere una plataforma de cursos tipo Udemy orientada a marketing digital e IA, donde instructores publican cursos y estudiantes los descubren, se inscriben y los valoran. Se necesita una primera versión que valide el flujo completo del marketplace antes de invertir en pagos u otras funciones.

## What Changes

- Proyecto nuevo (greenfield) con Next.js y Supabase (Postgres + Auth).
- Registro e inicio de sesión con dos roles: **instructor** y **estudiante**.
- Catálogo público de cursos publicados, con filtro por categoría, búsqueda y página de detalle.
- Gestión de cursos por el instructor: crear, editar, publicar y despublicar cursos, organizados en secciones y lecciones.
- Inscripción de estudiantes (gratuita) y acceso al contenido de las lecciones solo para inscritos.
- Reseñas con calificación de 1 a 5 y comentario, escritas por estudiantes inscritos.
- Toda la autorización se aplica en la base de datos mediante Row Level Security (RLS), no solo en la interfaz.
- Fuera de alcance en esta versión: pagos y checkout, certificados, quizzes, progreso por lección, funciones de IA (tutor, quizzes generados), rol de administrador.

## Capabilities

### New Capabilities
- `user-roles`: autenticación, perfiles y asignación de rol (instructor o estudiante) con permisos aplicados por RLS.
- `course-catalog`: listado público de cursos publicados con categorías, búsqueda y detalle del curso.
- `course-management`: creación, edición y publicación de cursos, secciones y lecciones por parte del instructor propietario.
- `course-enrollment`: inscripción del estudiante en un curso y acceso restringido al contenido de lecciones.
- `course-reviews`: calificaciones y comentarios de estudiantes inscritos, con promedio visible en el catálogo.

### Modified Capabilities
<!-- Ninguna: no existen specs previas. -->

## Impact

- Código: aplicación Next.js nueva (App Router) y proyecto Supabase nuevo.
- Base de datos: tablas de perfiles, categorías, cursos, secciones, lecciones, inscripciones y reseñas, con políticas RLS y migraciones versionadas.
- Dependencias: `@supabase/supabase-js` y `@supabase/ssr`.
- Infraestructura: proyecto Supabase y variables de entorno; el despliegue previsto es Vercel.
- Los campos de precio se omiten por ahora; añadir pagos más adelante será un cambio aparte.
