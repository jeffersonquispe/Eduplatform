## MODIFIED Requirements

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
