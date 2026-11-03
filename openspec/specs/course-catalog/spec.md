# course-catalog Specification

## Purpose

Ofrece a cualquier visitante un catálogo público de cursos publicados de marketing digital e IA, que puede explorar, filtrar y consultar en detalle antes de inscribirse.

## Requirements

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
El sistema SHALL permitir buscar cursos publicados escribiendo una frase libre con lo que la persona necesita. Los resultados SHALL ordenarse de mayor a menor cercanía de significado con la frase y SHALL incluir solo los cursos cuya similitud alcance el umbral de 0.8. La frase SHALL tener un máximo de 200 caracteres. Si la búsqueda por significado no está disponible, el sistema SHALL recurrir a la búsqueda por texto en el título y la descripción.

#### Scenario: Búsqueda con resultados
- **WHEN** un visitante busca una frase que describe una necesidad cubierta por un curso publicado
- **THEN** ese curso aparece en los resultados, ordenado por cercanía con la frase

#### Scenario: Cursos poco relacionados quedan fuera
- **WHEN** un curso publicado tiene una similitud menor a 0.8 con la frase buscada
- **THEN** ese curso no aparece en los resultados

#### Scenario: Búsqueda sin resultados
- **WHEN** un visitante busca una frase para la que ningún curso publicado alcanza el umbral de similitud
- **THEN** el sistema muestra un estado de sin resultados

#### Scenario: Búsqueda combinada con categoría
- **WHEN** un visitante busca una frase con una categoría seleccionada
- **THEN** los resultados incluyen solo cursos de esa categoría

#### Scenario: Solo cursos publicados
- **WHEN** un visitante busca una frase cercana a un curso en borrador
- **THEN** el borrador no aparece en los resultados

#### Scenario: Respaldo cuando falla la búsqueda por significado
- **WHEN** el servicio de búsqueda por significado no responde
- **THEN** el catálogo busca por texto en título y descripción en vez de mostrar un error

### Requirement: Página de detalle del curso
El sistema SHALL mostrar para un curso publicado su descripción, instructor, temario (secciones y títulos de lecciones) y reseñas, sin revelar el contenido de las lecciones a quien no esté inscrito.

#### Scenario: Detalle visible para visitante
- **WHEN** un visitante abre el detalle de un curso publicado
- **THEN** ve descripción, temario y reseñas, pero no el contenido de las lecciones

#### Scenario: Curso inexistente o no publicado
- **WHEN** un visitante abre el detalle de un curso que no existe o no está publicado
- **THEN** el sistema responde como no encontrado
