## Purpose

Define el sistema visual compartido de la plataforma: tokens, tema y componentes reutilizables, para que todas las pantallas se vean y se comporten de forma coherente.

## ADDED Requirements

### Requirement: Tema oscuro único basado en tokens
La interfaz SHALL usar un único tema oscuro cuyos colores, espaciados, radios y sombras provienen de tokens definidos en un solo lugar, y los componentes MUST NOT definir colores propios fuera de esos tokens.

#### Scenario: Color de texto semántico
- **WHEN** un componente aplica el color de texto secundario
- **THEN** usa el token semántico del sistema y no un valor de color literal

#### Scenario: Cambio de un token
- **WHEN** se modifica el valor de un token de color
- **THEN** todos los componentes que lo usan reflejan el cambio sin editarse individualmente

### Requirement: Biblioteca de componentes reutilizable
El sistema SHALL ofrecer componentes visuales reutilizables para botones, tarjetas, píldoras, campos de formulario, insignias, alertas, chips y barras de progreso, con variantes por intención (principal, secundaria, peligro, enlace).

#### Scenario: Botón con variante
- **WHEN** una pantalla necesita una acción destructiva
- **THEN** usa la variante de peligro del botón y se ve distinta de la acción principal

#### Scenario: Insignia de estado de curso
- **WHEN** se muestra un curso publicado o en borrador
- **THEN** una insignia indica "Publicado" o "Borrador" con tonos distintos

### Requirement: Estados de carga sin saltos de diseño
Las listas de cursos SHALL mostrar una rejilla de esqueletos con las mismas medidas que las tarjetas reales mientras cargan.

#### Scenario: Carga del catálogo
- **WHEN** el catálogo aún no ha recibido datos
- **THEN** se muestran tarjetas esqueleto y, al llegar los datos, el contenido no se desplaza

#### Scenario: Movimiento reducido
- **WHEN** el usuario prefiere movimiento reducido
- **THEN** los esqueletos no se animan
