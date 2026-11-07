## Why

La plataforma ya expone `GET /api/courses/search` para Edy, el microservicio conversacional (`sesion 8/edy-service`), pero una persona no tiene ninguna forma de hablar con Edy desde la plataforma: el servicio solo ofrece una API y un worker de voz, sin interfaz. Este cambio lleva a Edy a la plataforma como un asistente embebido en un iframe, con los modos de texto y voz del mockup `Asistente EduTech.dc.html`, para ayudar a encontrar cursos sin salir de la página.

## What Changes

**En la plataforma (este repo):**
- Botón flotante y panel en el layout raíz que cargan el asistente en un iframe solo al abrirlo por primera vez y conservan la conversación al navegar.
- Comunicación con el iframe mediante `postMessage` con validación de origen, para cerrar el panel y navegar a cursos sin recargar la página.
- Variable `NEXT_PUBLIC_EDY_URL`; sin ella, el asistente no se muestra.

**En `edy-service` (repo aparte):**
- Página del widget publicada por el propio servicio, que reimplementa el mockup con el tema oscuro del design system. No usa `support.js` ni `_ds_bundle.js` del mockup.
- `POST /chat` acepta un `history` opcional para mantener el hilo de la conversación. Los clientes que solo envían `message` siguen funcionando.
- Nuevo `POST /voice/token`, que entrega un token de LiveKit para una sala nueva, y duración máxima de las sesiones de voz.
- Límites de uso en `/chat` y `/voice/token`, y cabeceras que solo permiten embeber el widget desde los orígenes configurados.
- La marca que usa Edy pasa de "Eduplatform" a "EduTech", igual que en la plataforma.

**Adaptaciones del mockup:**
- Los textos y chips sobre lecciones (por ejemplo "Resume la leccion" y "Ver ejercicios") se sustituyen por otros sobre el catálogo, porque Edy no tiene acceso al contenido de las lecciones.
- Se añaden estados que el mockup no contempla: error, espera larga, micrófono denegado y voz no disponible.

**Fuera de alcance:**
- Tutor de lección: resúmenes, ejercicios y dudas sobre el contenido. Requiere pasar la sesión al iframe y leer `lesson_contents` con RLS; irá en un cambio posterior.
- Conversaciones personalizadas o ligadas a la cuenta, y su persistencia. El historial vive en memoria y se pierde al recargar la página.
- Límite de uso en `GET /api/courses/search`, que sigue siendo público y puede llamarse sin pasar por Edy.

## Capabilities

### New Capabilities
- `assistant-widget`: presencia del asistente en la plataforma: botón, panel, carga diferida del iframe, permisos, navegación, cierre y accesibilidad.
- `assistant-service`: comportamiento del asistente en `edy-service`: página del widget, conversación de texto con historial, sesiones de voz, límites de uso y orígenes autorizados para embeberlo.

### Modified Capabilities
<!-- Ninguna: los requisitos vigentes de interface-accessibility y design-system se aplican al panel sin cambiar. -->

## Impact

- **Plataforma:** `src/app/layout.tsx`, nuevo componente cliente en `src/components/`, nuevas clases en `src/app/globals.css`, `.env.example`, `playwright.config.ts`, un spec nuevo en `e2e/` y `CLAUDE.md`. No hay cambios de base de datos, RLS ni autenticación.
- **`edy-service`:** `api/main.py`, `voice/main.py`, `shared/system_prompt.py`, `shared/tools.py`, `requirements.txt`, `.env.example`, `README.md`, nueva carpeta `widget/` y primeras pruebas automatizadas.
- **Dependencias:** `livekit-api` explícito y `pytest` en `edy-service`; `livekit-client` servido desde el propio widget. La plataforma no añade dependencias.
- **Infraestructura y costo:** Edy y su worker de voz deben estar desplegados con HTTPS, porque el micrófono no funciona sin un contexto seguro. Cada uso consume cuota de Gemini, ElevenLabs y LiveKit.
- **Ejecución:** este cambio se planifica en este repo, pero parte de las tareas modifica `C:\Users\Jeff\Desktop\sesion 8\edy-service`, fuera de la raíz de edición que OpenSpec asigna a este proyecto. Aplicarlas requiere la autorización explícita del usuario.
