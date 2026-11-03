## Purpose

Permite a los estudiantes inscribirse gratuitamente en cursos publicados y ver el contenido de las lecciones solo cuando están inscritos.

## ADDED Requirements

### Requirement: Inscripción gratuita de estudiantes
El sistema SHALL permitir a un usuario autenticado con rol estudiante inscribirse en un curso publicado sin pago, y SHALL permitir una sola inscripción por estudiante y curso.

#### Scenario: Inscripción exitosa
- **WHEN** un estudiante autenticado se inscribe en un curso publicado
- **THEN** se crea su inscripción y puede acceder al contenido

#### Scenario: Inscripción duplicada
- **WHEN** un estudiante ya inscrito intenta inscribirse de nuevo en el mismo curso
- **THEN** el sistema no crea una segunda inscripción

#### Scenario: Visitante anónimo intenta inscribirse
- **WHEN** un visitante sin sesión intenta inscribirse
- **THEN** el sistema le pide iniciar sesión o registrarse

#### Scenario: Curso no publicado
- **WHEN** un estudiante intenta inscribirse en un curso en borrador
- **THEN** el sistema rechaza la inscripción

### Requirement: Contenido de lecciones solo para inscritos
El sistema SHALL mostrar el contenido de las lecciones únicamente a estudiantes inscritos en el curso y al instructor propietario, y MUST aplicar esta restricción en la base de datos.

#### Scenario: Estudiante inscrito lee una lección
- **WHEN** un estudiante inscrito abre una lección del curso
- **THEN** ve su contenido

#### Scenario: Usuario no inscrito consulta el contenido
- **WHEN** un usuario no inscrito, ni propietario, consulta el contenido de una lección, incluso llamando directamente a la API
- **THEN** no recibe el contenido

#### Scenario: Instructor ve su propio contenido
- **WHEN** el instructor propietario abre una lección de su curso, publicado o en borrador
- **THEN** ve su contenido

### Requirement: Privacidad de las inscripciones
El sistema SHALL permitir a cada estudiante ver únicamente sus propias inscripciones, y al instructor ver solo las inscripciones de sus cursos.

#### Scenario: Estudiante consulta sus cursos
- **WHEN** un estudiante abre "Mis cursos"
- **THEN** ve solo los cursos en los que está inscrito

#### Scenario: Estudiante intenta ver inscripciones ajenas
- **WHEN** un estudiante consulta las inscripciones de otro estudiante
- **THEN** no recibe ninguna fila

### Requirement: Cancelar inscripción
El sistema SHALL permitir a un estudiante cancelar su inscripción, tras lo cual perderá acceso al contenido.

#### Scenario: Cancelación
- **WHEN** un estudiante cancela su inscripción
- **THEN** deja de ver el contenido de las lecciones de ese curso
