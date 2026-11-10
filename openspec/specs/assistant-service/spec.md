# assistant-service Specification

## Purpose

Define el comportamiento del asistente Edy: la página embebible, la conversación por texto y voz sobre el catálogo público de cursos, y los controles que limitan dónde se embebe y cuánto puede consumirse.

## Requirements


### Requirement: Página del asistente embebible solo desde orígenes autorizados
El servicio SHALL publicar una página del asistente con los modos de texto y voz, y SHALL permitir embeberla únicamente desde los orígenes configurados.

#### Scenario: Origen autorizado
- **WHEN** la plataforma, en un origen configurado, carga la página en un iframe
- **THEN** el navegador la muestra

#### Scenario: Origen no autorizado
- **WHEN** un sitio con un origen no configurado intenta cargar la página en un iframe
- **THEN** el navegador bloquea la carga

### Requirement: Saludo y sugerencias sobre el catálogo
El modo texto SHALL abrir con un saludo y sugerencias que el asistente pueda atender con el catálogo público. MUST NOT ofrecer acciones sobre el contenido de lecciones, como resúmenes o ejercicios.

#### Scenario: Conversación nueva
- **WHEN** una persona abre el asistente por primera vez
- **THEN** ve el saludo de Edy, las sugerencias "Quiero aprender marketing digital", "Cursos de IA" y "Como me inscribo" y un campo de texto

#### Scenario: Uso de una sugerencia
- **WHEN** la persona activa una sugerencia
- **THEN** ese texto se envía como su mensaje

### Requirement: Conversación de texto con contexto
El servicio SHALL responder usando el mensaje actual y un historial opcional de turnos previos, limitado a los roles de persona y asistente. Las solicitudes que envíen solo el mensaje SHALL seguir funcionando. Las solicitudes con historial inválido SHALL rechazarse sin consultar al modelo.

#### Scenario: Pregunta de seguimiento
- **WHEN** la persona pregunta por cursos de marketing y luego escribe "el segundo, de que trata"
- **THEN** la respuesta tiene en cuenta el turno anterior

#### Scenario: Cliente sin historial
- **WHEN** un cliente envía solo `{"message": "..."}`
- **THEN** el servicio responde como antes con `{"reply": "..."}`

#### Scenario: Rol no permitido
- **WHEN** el historial incluye un turno con rol de sistema o de herramienta
- **THEN** el servicio responde 422 y no consulta al modelo

#### Scenario: Historial excedido
- **WHEN** el historial supera 12 turnos o un turno supera 2000 caracteres
- **THEN** el servicio responde 422 y no consulta al modelo

#### Scenario: Historial de mensajes en el cliente
- **WHEN** la conversación supera 12 turnos previos
- **THEN** el cliente envía solo los 12 más recientes y sigue mostrando todos en pantalla

### Requirement: Estados de la conversación de texto
El modo texto SHALL mostrar un indicador mientras espera, avisar si la espera se alarga y mostrar un error con opción de reintento si la respuesta falla, sin perder el mensaje de la persona. Los mensajes nuevos SHALL anunciarse a las tecnologías de apoyo.

#### Scenario: Espera larga
- **WHEN** una respuesta tarda más de 20 segundos
- **THEN** el asistente muestra "Sigo buscando, esto esta tardando mas de lo normal"

#### Scenario: Fallo del servicio
- **WHEN** la solicitud falla o no termina en 180 segundos
- **THEN** el asistente muestra un error con "Reintentar", conserva el mensaje enviado y su estado pasa de "En linea" a "Sin conexion"

#### Scenario: Reintento correcto
- **WHEN** la persona reintenta y la solicitud responde bien
- **THEN** aparece la respuesta, el mensaje no se duplica y el estado vuelve a "En linea"

### Requirement: Enlaces seguros en las respuestas
El asistente SHALL mostrar las respuestas sin interpretar HTML y SHALL convertir en enlaces solo las URL y rutas que apunten a la plataforma. Cualquier otra URL SHALL mostrarse como texto.

#### Scenario: Enlace a un curso
- **WHEN** una respuesta incluye la URL de un curso de la plataforma y la persona la activa
- **THEN** la plataforma muestra ese curso

#### Scenario: Enlace externo
- **WHEN** una respuesta incluye una URL de otro dominio
- **THEN** se muestra como texto no clicable

#### Scenario: HTML en la respuesta
- **WHEN** una respuesta o un mensaje contiene etiquetas HTML
- **THEN** se muestran como texto y no se ejecutan

### Requirement: Sesión de voz
El modo voz SHALL iniciar una conversación solo cuando la persona lo solicite, en una sala exclusiva para esa sesión. SHALL mostrar los estados de conexión, escucha, procesamiento y respuesta, junto con la transcripción. El control del micrófono SHALL tener nombre accesible y respetar la preferencia de movimiento reducido.

#### Scenario: Inicio correcto
- **WHEN** la persona activa el micrófono y concede el permiso
- **THEN** el asistente conecta, Edy saluda y el estado cambia según escuche, procese o responda

#### Scenario: Sesiones independientes
- **WHEN** dos personas inician una sesión de voz al mismo tiempo
- **THEN** cada una participa en una sala distinta y no escucha a la otra

#### Scenario: Fin de la sesión
- **WHEN** la persona detiene el micrófono o vuelve al modo texto
- **THEN** la sesión termina y el micrófono deja de usarse

#### Scenario: Movimiento reducido
- **WHEN** la persona prefiere movimiento reducido
- **THEN** el control del micrófono no muestra animaciones continuas y el estado se sigue comunicando con texto

### Requirement: Fallos de voz sin bloquear el texto
Si la voz no está disponible, el asistente SHALL explicarlo y mantener disponible el modo texto.

#### Scenario: Micrófono denegado
- **WHEN** la persona o el navegador deniegan el micrófono
- **THEN** el asistente indica "Necesito permiso de microfono para hablar contigo" y permite volver al texto

#### Scenario: Voz no configurada
- **WHEN** el servicio no tiene configurada la voz
- **THEN** la solicitud de sesión responde 503 y el asistente indica que la voz no está disponible

#### Scenario: Agente sin responder
- **WHEN** ningún agente se une a la sala en 15 segundos
- **THEN** la sesión termina y el asistente indica que la voz no está disponible

### Requirement: Duración limitada de la voz
El servicio SHALL terminar cada sesión de voz al alcanzar su duración máxima, 5 minutos por defecto, y el asistente SHALL informarlo a la persona.

#### Scenario: Límite alcanzado
- **WHEN** una sesión de voz alcanza la duración máxima
- **THEN** el servicio cierra la sesión y el asistente muestra "La sesion de voz termino" con la opción de iniciar otra

### Requirement: Transcripción disponible en el texto
Al terminar una sesión de voz, el asistente SHALL añadir la transcripción final al chat de texto, para que la conversación pueda continuar allí.

#### Scenario: Volver al texto
- **WHEN** la persona vuelve al modo texto tras una sesión de voz
- **THEN** ve sus frases y las de Edy en el chat, y su siguiente mensaje las incluye como historial

### Requirement: Límites de uso
El servicio SHALL limitar por cliente las solicitudes de chat y de sesiones de voz, y SHALL limitar además el total de sesiones de voz nuevas por hora. Al superar un límite SHALL responder 429 sin consultar a los proveedores, y el asistente SHALL mostrar un mensaje comprensible.

#### Scenario: Exceso de mensajes
- **WHEN** un cliente supera el límite de solicitudes de chat
- **THEN** el servicio responde 429 y el asistente indica "Demasiados mensajes, intenta en un momento"

#### Scenario: Exceso de sesiones de voz
- **WHEN** un cliente supera el límite de sesiones o se agota el total por hora
- **THEN** el servicio responde 429 y no emite ninguna credencial de voz

### Requirement: Credenciales de voz acotadas
El servicio SHALL entregar al navegador solo una credencial temporal válida para una única sala. MUST NOT exponer al navegador las claves de los proveedores.

#### Scenario: Credencial emitida
- **WHEN** se solicita una sesión de voz
- **THEN** la respuesta contiene una credencial de corta duración limitada a una sala nueva y ninguna clave de proveedor

### Requirement: Límites del conocimiento de Edy
Edy SHALL presentarse como asistente de EduTech y responder solo con datos del catálogo público en texto y voz. Ante preguntas sobre contenido de lecciones, SHALL decir que no tiene ese detalle.

#### Scenario: Pregunta sobre una lección
- **WHEN** la persona pide resumir una lección
- **THEN** Edy indica que no tiene ese detalle y puede orientarla a los cursos del catálogo

#### Scenario: Curso inexistente
- **WHEN** la búsqueda no devuelve cursos
- **THEN** Edy lo dice sin inventar cursos y sugiere reformular la búsqueda
