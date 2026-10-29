## Purpose

Ofrece a cualquier visitante un catálogo público de cursos publicados de marketing digital e IA, que puede explorar, filtrar y consultar en detalle antes de inscribirse.

## ADDED Requirements

### Requirement: Listado público de cursos publicados
El sistema SHALL mostrar a cualquier visitante, autenticado o no, únicamente los cursos con estado publicado, indicando título, instructor, categoría, calificación promedio y número de reseñas.

#### Scenario: Visitante anónimo ve el catálogo
- **WHEN** un visitante anónimo abre el catálogo
- **THEN** ve solo cursos publicados

#### Scenario: Curso en borrador oculto
- **WHEN** existe un curso en borrador
- **THEN** no aparece en el catálogo para nadie excepto, en su propio panel, para el instructor propietario

### Requirement: Filtro por categoría
El sistema SHALL permitir filtrar el catálogo por categoría, y las categorías iniciales SHALL cubrir marketing digital, inteligencia artificial e IA aplicada al marketing.

#### Scenario: Filtrar por categoría
- **WHEN** un visitante selecciona una categoría
- **THEN** el catálogo muestra solo los cursos publicados de esa categoría

### Requirement: Búsqueda por texto
El sistema SHALL permitir buscar cursos publicados por texto en el título y la descripción.

#### Scenario: Búsqueda con resultados
- **WHEN** un visitante busca un término presente en el título de un curso publicado
- **THEN** ese curso aparece en los resultados

#### Scenario: Búsqueda sin resultados
- **WHEN** un visitante busca un término que no coincide con ningún curso publicado
- **THEN** el sistema muestra un estado de sin resultados

### Requirement: Página de detalle del curso
El sistema SHALL mostrar para un curso publicado su descripción, instructor, temario (secciones y títulos de lecciones) y reseñas, sin revelar el contenido de las lecciones a quien no esté inscrito.

#### Scenario: Detalle visible para visitante
- **WHEN** un visitante abre el detalle de un curso publicado
- **THEN** ve descripción, temario y reseñas, pero no el contenido de las lecciones

#### Scenario: Curso inexistente o no publicado
- **WHEN** un visitante abre el detalle de un curso que no existe o no está publicado
- **THEN** el sistema responde como no encontrado
