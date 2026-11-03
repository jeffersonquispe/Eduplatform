## Purpose

Garantiza que los controles de la interfaz sean utilizables con teclado, pantallas táctiles y tecnologías de apoyo, con contraste y estados suficientes.

## ADDED Requirements

### Requirement: Foco visible en todos los controles
Todo control interactivo SHALL mostrar un indicador de foco de teclado con contraste de al menos 3:1 frente a su fondo, y el indicador MUST seguir siendo visible en modo de colores forzados (alto contraste).

#### Scenario: Foco con teclado en un botón
- **WHEN** el usuario enfoca un botón con la tecla Tab
- **THEN** aparece un anillo de foco claramente visible

#### Scenario: Modo de alto contraste
- **WHEN** el sistema opera con colores forzados
- **THEN** el control enfocado conserva un contorno visible

### Requirement: Áreas táctiles suficientes
Los enlaces y botones SHALL medir al menos 24 px de alto en cualquier puntero y al menos 44 px en dispositivos con puntero táctil.

#### Scenario: Enlace del instructor en una tarjeta
- **WHEN** se usa una pantalla táctil
- **THEN** el enlace del instructor en la tarjeta tiene un área de al menos 44 px de alto

### Requirement: Estados de interacción completos
Los botones y píldoras SHALL tener estados de hover, foco, activo y deshabilitado; los campos de texto SHALL tener estados de foco, deshabilitado y error (`aria-invalid`).

#### Scenario: Botón deshabilitado
- **WHEN** un botón está deshabilitado
- **THEN** se ve atenuado, muestra cursor de no permitido y no cambia con hover

#### Scenario: Campo con error
- **WHEN** un campo se marca como inválido
- **THEN** su borde adopta el color de error

#### Scenario: Enlace con apariencia de botón
- **WHEN** el usuario pasa el puntero sobre un botón de variante enlace
- **THEN** el texto permanece subrayado

### Requirement: Valoración comprensible para lectores de pantalla
La valoración de un curso SHALL anunciar su significado, no solo el número.

#### Scenario: Lectura de la valoración
- **WHEN** un lector de pantalla lee la valoración de un curso con reseñas
- **THEN** anuncia "Valoración:" seguido del promedio y del número de reseñas, y no lee el símbolo de estrella decorativo

#### Scenario: Curso sin reseñas
- **WHEN** un curso no tiene reseñas
- **THEN** se muestra el texto "Aun sin valoraciones"
