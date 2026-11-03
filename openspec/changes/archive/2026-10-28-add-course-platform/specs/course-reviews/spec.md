## Purpose

Permite a los estudiantes inscritos valorar los cursos con una calificación y un comentario, para ayudar a otros visitantes a elegir y dar retroalimentación al instructor.

## ADDED Requirements

### Requirement: Reseña de estudiantes inscritos
El sistema SHALL permitir dejar una reseña, con calificación entera de 1 a 5 y comentario opcional, únicamente a estudiantes inscritos en el curso.

#### Scenario: Estudiante inscrito reseña
- **WHEN** un estudiante inscrito envía una calificación de 4 con un comentario
- **THEN** la reseña se guarda y es visible en el curso

#### Scenario: Estudiante no inscrito reseña
- **WHEN** un usuario no inscrito intenta reseñar un curso
- **THEN** el sistema rechaza la reseña

#### Scenario: Calificación fuera de rango
- **WHEN** se envía una calificación menor que 1 o mayor que 5
- **THEN** el sistema rechaza la reseña

### Requirement: Una reseña por estudiante y curso
El sistema SHALL permitir una única reseña por estudiante y curso, y SHALL permitir al autor editarla o eliminarla.

#### Scenario: Reseña duplicada
- **WHEN** un estudiante que ya reseñó un curso envía otra reseña nueva
- **THEN** el sistema no crea una segunda reseña

#### Scenario: Autor edita su reseña
- **WHEN** el autor modifica su reseña
- **THEN** se guarda la versión actualizada

#### Scenario: Otro usuario edita la reseña
- **WHEN** un usuario distinto del autor intenta modificar o eliminar la reseña
- **THEN** el sistema lo rechaza

### Requirement: Instructor no reseña su propio curso
El sistema MUST impedir que el instructor propietario reseñe su propio curso.

#### Scenario: Autovaloración
- **WHEN** un instructor intenta reseñar un curso suyo
- **THEN** el sistema rechaza la reseña

### Requirement: Reseñas públicas y promedio
El sistema SHALL mostrar las reseñas de un curso publicado a cualquier visitante, y SHALL calcular y mostrar la calificación promedio y el número de reseñas en el catálogo y en el detalle.

#### Scenario: Promedio calculado
- **WHEN** un curso tiene reseñas con calificaciones 5 y 3
- **THEN** su promedio mostrado es 4,0 con 2 reseñas

#### Scenario: Curso sin reseñas
- **WHEN** un curso no tiene reseñas
- **THEN** el catálogo indica que aún no tiene valoraciones
