## Purpose

Permite a los instructores crear y mantener sus cursos, secciones y lecciones, y controlar cuándo un curso está publicado, sin poder tocar los cursos de otros instructores.

## ADDED Requirements

### Requirement: Solo instructores crean cursos
El sistema SHALL permitir crear cursos únicamente a usuarios con rol instructor, y cada curso SHALL pertenecer al instructor que lo crea.

#### Scenario: Instructor crea un curso
- **WHEN** un instructor crea un curso con título, descripción y categoría
- **THEN** el curso se guarda en estado borrador y le pertenece

#### Scenario: Estudiante intenta crear un curso
- **WHEN** un usuario con rol estudiante intenta crear un curso
- **THEN** el sistema lo rechaza

### Requirement: Edición restringida al propietario
El sistema SHALL permitir editar o eliminar un curso, sus secciones y sus lecciones únicamente al instructor propietario.

#### Scenario: Propietario edita su curso
- **WHEN** el instructor propietario modifica su curso
- **THEN** los cambios se guardan

#### Scenario: Otro instructor intenta editar
- **WHEN** un instructor intenta modificar un curso de otro instructor
- **THEN** el sistema rechaza el cambio y el curso queda intacto

### Requirement: Secciones y lecciones ordenadas
El sistema SHALL organizar cada curso en secciones ordenadas, y cada sección en lecciones ordenadas, con título y contenido (texto y un enlace a video).

#### Scenario: Agregar una lección
- **WHEN** el instructor agrega una lección a una sección de su curso
- **THEN** la lección aparece al final de esa sección

#### Scenario: Reordenar lecciones
- **WHEN** el instructor cambia el orden de las lecciones
- **THEN** el temario refleja el nuevo orden

### Requirement: Publicación con requisitos mínimos
El sistema SHALL permitir publicar un curso solo si tiene título, descripción, categoría y al menos una lección, y SHALL permitir al instructor despublicarlo.

#### Scenario: Publicación válida
- **WHEN** el instructor publica un curso que cumple los requisitos mínimos
- **THEN** el curso pasa a estado publicado y aparece en el catálogo

#### Scenario: Publicación incompleta
- **WHEN** el instructor intenta publicar un curso sin lecciones
- **THEN** el sistema rechaza la publicación e indica qué falta

#### Scenario: Despublicar un curso
- **WHEN** el instructor despublica un curso publicado
- **THEN** deja de aparecer en el catálogo y los estudiantes ya inscritos conservan su inscripción

### Requirement: Panel del instructor
El sistema SHALL mostrar al instructor la lista de sus propios cursos, publicados y en borrador, con el número de estudiantes inscritos.

#### Scenario: Instructor consulta su panel
- **WHEN** un instructor abre su panel
- **THEN** ve solo sus cursos, con el número de inscritos de cada uno
