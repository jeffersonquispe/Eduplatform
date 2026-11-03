## Purpose

Explica de forma visual cómo trabaja un agente de IA mediante una animación interactiva en la página principal, alineada con el tema de la plataforma.

## ADDED Requirements

### Requirement: Animación en la página principal
La página principal SHALL incluir la sección "El taller del agente" con una animación de 59,5 segundos que se repite en bucle y muestra las fases pensar, actuar y observar, un fallo corregido y la memoria de trabajo.

#### Scenario: Visita a la página principal
- **WHEN** un visitante abre la página principal
- **THEN** ve la sección con la animación entre la presentación y las categorías

### Requirement: Controles del usuario
La animación SHALL ofrecer controles para reproducir o pausar, activar o silenciar el sonido y moverse por la línea de tiempo, todos operables con teclado y con nombre accesible.

#### Scenario: Sonido desactivado por defecto
- **WHEN** la animación se carga
- **THEN** no emite sonido hasta que el usuario lo activa

#### Scenario: Pausa
- **WHEN** el usuario pulsa Pausar
- **THEN** la animación se detiene y el botón pasa a indicar Reproducir

### Requirement: Respeto de preferencias y recursos
La animación SHALL no iniciarse sola si el usuario prefiere movimiento reducido, y SHALL pausarse mientras no esté visible en pantalla.

#### Scenario: Movimiento reducido
- **WHEN** el usuario tiene activada la preferencia de movimiento reducido
- **THEN** la animación se carga en pausa

#### Scenario: Fuera de pantalla
- **WHEN** el usuario se desplaza de modo que la animación deja de ser visible
- **THEN** el reloj de la animación se detiene

### Requirement: Alternativa textual
La animación SHALL tener una descripción textual para tecnologías de apoyo.

#### Scenario: Lector de pantalla
- **WHEN** un lector de pantalla llega a la animación
- **THEN** anuncia una descripción de lo que ocurre en ella
