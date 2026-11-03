# course-embeddings Specification

## Purpose

Mantiene para cada curso un vector que representa su significado, generado automáticamente y protegido de lectura pública, para que el catálogo pueda buscar por lo que una persona necesita y no solo por palabras exactas.

## Requirements

### Requirement: Embedding generado automáticamente
El sistema SHALL calcular el embedding de un curso cuando se crea y cuando pasa a estado publicado, sin intervención del instructor. El texto de entrada SHALL incluir título, descripción, categoría, temario (secciones y títulos de lecciones) y el contenido de las lecciones, con un largo máximo de 2000 caracteres y el contenido de cada lección recortado a 300.

#### Scenario: Curso nuevo
- **WHEN** un instructor crea un curso
- **THEN** el sistema calcula y guarda su embedding

#### Scenario: Curso que se publica
- **WHEN** un curso en borrador pasa a publicado
- **THEN** el sistema recalcula su embedding con el título, descripción, temario y contenido vigentes

#### Scenario: Otros cambios de estado
- **WHEN** un curso se despublica o se edita sin cambiar su estado
- **THEN** el sistema no recalcula su embedding

### Requirement: El embedding no se expone
El sistema SHALL impedir que visitantes y usuarios autenticados lean el vector guardado de un curso. La búsqueda SHALL devolver únicamente datos públicos del curso (título, descripción, calificación, categoría, instructor y similitud) y únicamente de cursos publicados.

#### Scenario: Lectura directa del vector
- **WHEN** un visitante o usuario autenticado intenta leer el embedding de un curso
- **THEN** el sistema rechaza la lectura

#### Scenario: Resultados de búsqueda
- **WHEN** se devuelven resultados de búsqueda
- **THEN** cada resultado incluye solo datos públicos y nunca el vector ni el estado del curso

### Requirement: Un fallo no bloquea el curso
El sistema SHALL guardar y publicar un curso aunque no se pueda calcular su embedding. Un curso sin embedding SHALL quedar fuera de los resultados de búsqueda por significado.

#### Scenario: Servicio de embeddings no disponible
- **WHEN** un instructor publica un curso y el cálculo del embedding falla
- **THEN** el curso queda publicado y visible en el catálogo, pero no aparece en las búsquedas por significado

### Requirement: Cálculo solo por solicitudes autorizadas
El sistema SHALL aceptar solicitudes de cálculo de embedding únicamente cuando incluyan el secreto compartido con la base de datos.

#### Scenario: Solicitud sin secreto
- **WHEN** llega una solicitud de cálculo sin el secreto o con uno incorrecto
- **THEN** el sistema responde como no autorizada y no modifica ningún curso
