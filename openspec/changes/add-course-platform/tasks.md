## 1. Configuración del proyecto

- [ ] 1.1 Crear la app Next.js (App Router, TypeScript) y verificar que `npm run dev` sirve la página inicial
- [ ] 1.2 Instalar `@supabase/supabase-js` y `@supabase/ssr` y verificar que `npm run build` termina sin errores
- [ ] 1.3 Inicializar Supabase local (`supabase init`, `supabase start`) y verificar que los servicios arrancan
- [ ] 1.4 Crear `.env.example` con la URL y la clave pública, y verificar que `.env.local` está en `.gitignore`

## 2. Esquema de base de datos y RLS

- [ ] 2.1 Migración de `profiles` con enum de rol, trigger de alta desde `auth.users`, RLS y `UPDATE` revocado sobre `role`; verificar con prueba SQL que un estudiante no puede cambiar su rol
- [ ] 2.2 Migración de `categories` con las categorías iniciales (marketing digital, IA, IA aplicada al marketing) y lectura pública; verificar con una consulta anónima
- [ ] 2.3 Migración de `courses`, `sections` y `lessons` con RLS de propietario y lectura pública solo si el curso está publicado; verificar con pruebas SQL como anon, propietario y otro instructor
- [ ] 2.4 Migración de `lesson_contents` con lectura solo para inscritos y propietario; verificar que un usuario no inscrito recibe cero filas
- [ ] 2.5 Migración de `enrollments` con unicidad estudiante-curso, solo cursos publicados y RLS de privacidad; verificar duplicado rechazado y aislamiento entre estudiantes
- [ ] 2.6 Funciones `is_enrolled` y `owns_course` con `SECURITY DEFINER`, `search_path` fijo y `EXECUTE` restringido; verificar que las políticas no producen recursión
- [ ] 2.7 Migración de `reviews` con rango 1 a 5, una por estudiante y curso, solo inscritos y no propietario; verificar cada escenario de la spec con pruebas SQL
- [ ] 2.8 Triggers de `rating_avg` y `rating_count`; verificar que reseñas de 5 y 3 dan promedio 4,0 con 2 reseñas
- [ ] 2.9 Trigger de validación de publicación; verificar que publicar sin lecciones falla y con requisitos completos funciona
- [ ] 2.10 Columna `search` con índice GIN y configuración `spanish`; verificar que una búsqueda por título devuelve el curso
- [ ] 2.11 Prueba automatizada que falle si alguna tabla de `public` tiene RLS desactivado; verificar que pasa sobre todas las migraciones

## 3. Autenticación y roles en la aplicación

- [ ] 3.1 Clientes Supabase de servidor, navegador y proxy de refresco de sesión; verificar que la sesión persiste al recargar
- [ ] 3.2 Páginas de registro (con selector de rol) e inicio de sesión; verificar el alta de un estudiante y de un instructor, y el rechazo de correo duplicado
- [ ] 3.3 Cierre de sesión y mensaje genérico ante credenciales inválidas; verificar ambos comportamientos manualmente
- [ ] 3.4 Protección de rutas por rol (panel de instructor, mis cursos); verificar que un estudiante es redirigido fuera del panel de instructor
- [ ] 3.5 Página de perfil público del instructor sin exponer el correo; verificar que la respuesta no contiene el correo

## 4. Catálogo público

- [ ] 4.1 Listado de cursos publicados con instructor, categoría, promedio y número de reseñas; verificar que un borrador no aparece
- [ ] 4.2 Filtro por categoría; verificar que solo se muestran cursos de la categoría elegida
- [ ] 4.3 Búsqueda por texto con estado de sin resultados; verificar un caso con resultados y otro sin ellos
- [ ] 4.4 Página de detalle con descripción, temario y reseñas, sin contenido de lecciones; verificar que un visitante no ve el contenido y que un curso inexistente da 404

## 5. Gestión de cursos del instructor

- [ ] 5.1 Panel del instructor con sus cursos, estado e inscritos; verificar que no aparecen cursos de otros instructores
- [ ] 5.2 Formulario de crear y editar curso, con borrador por defecto; verificar creación como instructor y rechazo como estudiante
- [ ] 5.3 CRUD de secciones y lecciones con contenido en texto y enlace a video; verificar que otro instructor no puede editarlas
- [ ] 5.4 Reordenamiento de secciones y lecciones mediante función RPC transaccional; verificar que el temario refleja el nuevo orden
- [ ] 5.5 Acciones de publicar y despublicar con mensaje de lo que falta; verificar publicación válida, rechazo por curso incompleto y que los inscritos conservan acceso tras despublicar

## 6. Inscripción y aprendizaje

- [ ] 6.1 Botón de inscripción con redirección a inicio de sesión para anónimos; verificar inscripción, duplicado y curso en borrador
- [ ] 6.2 Página "Mis cursos" del estudiante; verificar que solo muestra sus inscripciones
- [ ] 6.3 Reproductor de lecciones con navegación entre ellas; verificar acceso para inscrito y propietario, y cero contenido para no inscritos al consultar la API directamente
- [ ] 6.4 Cancelación de inscripción; verificar que se pierde el acceso al contenido

## 7. Reseñas

- [ ] 7.1 Formulario de reseña con calificación y comentario para inscritos; verificar rechazo de no inscritos, de propietario y de valores fuera de rango
- [ ] 7.2 Editar y eliminar la propia reseña; verificar que otro usuario no puede hacerlo
- [ ] 7.3 Listado de reseñas y promedio en detalle y catálogo, con estado sin valoraciones; verificar promedio de 4,0 con reseñas 5 y 3

## 8. Verificación e integración

- [ ] 8.1 Datos de ejemplo (`seed.sql`) con un instructor, un estudiante y dos cursos; verificar que `supabase db reset` los carga
- [ ] 8.2 Recorrido completo de extremo a extremo: instructor publica, estudiante se inscribe, aprende y reseña; verificar que el promedio se refleja en el catálogo
- [ ] 8.3 Revisión de seguridad: confirmar que `service_role` no se usa en el código de la app y que las pruebas RLS cubren todos los escenarios de las specs

