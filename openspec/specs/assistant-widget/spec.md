# assistant-widget Specification

## Purpose

Permite abrir el asistente de cursos desde la plataforma en un panel embebido, sin salir de la página ni perder la conversación al navegar, y de forma utilizable con teclado, pantallas táctiles y tecnologías de apoyo.

## Requirements

### Requirement: Acceso al asistente
La plataforma SHALL mostrar un botón visible con el nombre "Asistente" en todas las páginas, excepto bajo `/aprender`. Si la URL del servicio del asistente no está configurada, la plataforma SHALL no mostrar el botón ni el panel.

#### Scenario: Página del catálogo
- **WHEN** un visitante sin sesión abre `/cursos`
- **THEN** ve el botón "Asistente"

#### Scenario: Página de una lección
- **WHEN** un estudiante abre una página bajo `/aprender`
- **THEN** no ve el botón ni el panel del asistente

#### Scenario: Servicio no configurado
- **WHEN** la URL del servicio del asistente no está configurada
- **THEN** ninguna página muestra el botón ni carga el iframe, y el resto de la plataforma funciona con normalidad

### Requirement: Carga diferida del asistente
La plataforma SHALL no solicitar ningún recurso del servicio del asistente hasta que la persona abra el panel por primera vez.

#### Scenario: Página sin abrir el asistente
- **WHEN** una persona navega por la plataforma sin abrir el panel
- **THEN** no se realiza ninguna solicitud al servicio del asistente

#### Scenario: Primera apertura
- **WHEN** una persona activa el botón "Asistente" por primera vez
- **THEN** el panel se abre y carga el asistente en un iframe con título accesible

### Requirement: Conversación conservada durante la sesión de navegación
La plataforma SHALL conservar la conversación al cerrar y reabrir el panel y al navegar sin recargar la página.

#### Scenario: Cerrar y reabrir
- **WHEN** una persona cierra el panel y lo vuelve a abrir
- **THEN** ve la misma conversación, sin que el asistente se vuelva a cargar

#### Scenario: Navegación interna
- **WHEN** una persona con la conversación abierta navega a otra página sin recargar
- **THEN** el panel sigue abierto y la conversación se mantiene

### Requirement: Permisos mínimos del iframe
La plataforma SHALL conceder al iframe solo los permisos que necesita el asistente: ejecutar scripts, enviar formularios, usar el micrófono y reproducir audio. La plataforma MUST NOT entregarle la sesión ni los datos de la persona.

#### Scenario: Modo voz
- **WHEN** la persona inicia el modo voz dentro del iframe
- **THEN** el navegador puede solicitarle permiso de micrófono para el origen del asistente

#### Scenario: Datos de sesión
- **WHEN** una persona con sesión iniciada abre el asistente
- **THEN** ni la URL del iframe ni los mensajes que recibe contienen su sesión, token o datos personales

### Requirement: Mensajes del iframe validados
La plataforma SHALL aceptar mensajes del iframe solo si provienen exactamente del origen configurado del asistente. Las solicitudes de navegación SHALL aceptarse solo para rutas internas de `/cursos`, `/cursos/[id]`, `/registro`, `/login` y `/mis-cursos`.

#### Scenario: Navegación a un curso
- **WHEN** el iframe solicita navegar a `/cursos/[id]`
- **THEN** la plataforma muestra ese curso sin recargar la página y la conversación se mantiene

#### Scenario: Navegación con el panel a pantalla completa
- **WHEN** el iframe solicita navegar en una pantalla de hasta 480 px de ancho
- **THEN** el panel se cierra para mostrar la página de destino y la conversación se mantiene al reabrirlo

#### Scenario: Mensaje de otro origen
- **WHEN** una ventana con un origen distinto envía una solicitud de navegación o cierre
- **THEN** la plataforma la ignora

#### Scenario: Ruta no permitida
- **WHEN** el iframe solicita navegar a una URL externa o a una ruta fuera de la lista permitida
- **THEN** la plataforma la ignora y no cambia de página

### Requirement: Fallo de carga visible
Si el asistente no confirma que está listo en un tiempo razonable, el panel SHALL mostrar un mensaje de error y ofrecer un reintento, y su cierre SHALL seguir funcionando.

#### Scenario: Servicio caído
- **WHEN** el iframe no confirma que está listo en 10 segundos
- **THEN** el panel muestra "El asistente no esta disponible ahora" con la opción "Reintentar"

#### Scenario: Reintento correcto
- **WHEN** la persona activa "Reintentar" y el asistente confirma que está listo
- **THEN** el mensaje de error desaparece y se muestra el asistente

### Requirement: Cierre y foco accesibles
El panel SHALL poder cerrarse con un botón propio con nombre accesible y con la tecla Escape, tanto si el foco está en la plataforma como dentro del iframe. Al abrirse, el foco SHALL pasar al asistente, y al cerrarse SHALL volver al botón "Asistente". El panel MUST NOT bloquear el uso del resto de la página.

#### Scenario: Escape dentro del iframe
- **WHEN** el foco está dentro del iframe y la persona pulsa Escape
- **THEN** el panel se cierra y el foco vuelve al botón "Asistente"

#### Scenario: Cierre con el botón
- **WHEN** la persona activa el botón de cerrar del panel
- **THEN** el panel se cierra y el foco vuelve al botón "Asistente"

#### Scenario: Página detrás del panel
- **WHEN** el panel está abierto en una pantalla de escritorio
- **THEN** la persona puede seguir usando con teclado y puntero el contenido no cubierto por el panel

### Requirement: La voz termina al ocultar el panel
Cuando el panel se cierre o deje de mostrarse, la plataforma SHALL avisar al asistente para que termine cualquier sesión de voz activa.

#### Scenario: Cierre con voz activa
- **WHEN** la persona cierra el panel durante una sesión de voz
- **THEN** la sesión termina y el micrófono deja de usarse

#### Scenario: Navegación a una lección con voz activa
- **WHEN** la persona navega a `/aprender` durante una sesión de voz
- **THEN** el panel se oculta, la sesión termina y el micrófono deja de usarse

### Requirement: Panel adaptable
En pantallas amplias, el panel SHALL mostrarse como una ventana lateral de 400 px de ancho, junto al borde derecho y bajo la cabecera, ocupando la altura disponible. SHALL ocupar toda la ventana en pantallas de hasta 480 px de ancho. No SHALL provocar desplazamiento horizontal.

#### Scenario: Pantalla de teléfono
- **WHEN** una persona abre el panel en una pantalla de 375 px de ancho
- **THEN** el panel ocupa toda la ventana, el botón de cerrar es visible y mide al menos 44 px de alto en táctil

#### Scenario: Ventana baja de escritorio
- **WHEN** la altura de la ventana es menor que la del panel
- **THEN** el panel se reduce y su botón de cerrar sigue visible
