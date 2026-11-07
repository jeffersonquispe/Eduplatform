## Context

Motivación y alcance en `proposal.md`; comportamiento en `specs/`.

Estado actual:

- **Plataforma (Next.js 16):** no tiene iframes, CSP ni `X-Frame-Options`. `src/app/layout.tsx` persiste entre navegaciones internas y siempre pinta `SiteHeader`.
- **`edy-service` (FastAPI, repo aparte en `sesion 8/edy-service`):**
  - `POST /chat` recibe un solo `message`; no hay historial, CORS, interfaz ni pruebas.
  - `voice/main.py` es un worker de LiveKit que funciona, pero el navegador no tiene forma de obtener un token. Ese código está sin commit.
  - Ambos canales comparten `shared/`, y sus reglas limitan a Edy al catálogo público.
- **Mockup (`Asistente EduTech chatbot/`):** define un panel de 400x680 con cabecera, conmutador de modo, mensajes, chips, entrada y modo voz. Es claro, usa colores fijos y depende del runtime de Claude Design (`support.js`, `_ds_bundle.js`). No incluye botón de apertura, cierre ni estados de error.

```
 Plataforma (Next.js)                     edy-service (FastAPI)
 +-------------------------------+        +--------------------------+
 | layout.tsx                    |        | GET  /widget/  + /config |
 |  AssistantWidget              |        | POST /chat (+ history)   |
 |  +-------------------------+  |        | POST /voice/token        |
 |  | iframe EDY/widget/      |--|------->| CSP frame-ancestors      |
 |  +-------------------------+  |        +-----+-------------+------+
 |     ^                         |              |             |
 |     | postMessage (origen     |              v             v
 |     | validado en ambos lados)|     /api/courses/search   LiveKit +
 +-------------------------------+     (plataforma)          ElevenLabs
```

## Goals / Non-Goals

**Goals:**

- Mantener el cambio en la plataforma pequeño y sin datos: botón, panel y puente de mensajes.
- Mantener `shared/` como única fuente de reglas de Edy para texto y voz.
- Hacer que un fallo de Edy nunca afecte a la plataforma.

**Non-Goals:**

- Autenticar a la persona ante Edy o acceder a datos con RLS.
- Sincronizar el contexto en sentido texto a voz: la voz empieza sin el historial del chat.
- Respuestas en streaming: `/chat` sigue devolviendo la respuesta completa.
- Escalar a varias instancias: los límites en memoria asumen un único proceso.

## Decisions

### 1. El widget vive y se publica en `edy-service`

`GET /widget/` sirve archivos estáticos desde `edy-service/widget/`, resueltos respecto al archivo y no al directorio de trabajo.

- Por qué: al compartir origen con `/chat` y `/voice/token`, no hace falta CORS, y el asistente se puede actualizar sin desplegar la plataforma.
- Alternativa: una ruta `/asistente` en Next. Se descarta porque la página heredaría `SiteHeader` salvo que se reorganice el layout raíz con grupos de rutas, y porque seguiría necesitando CORS hacia Edy.

### 2. HTML, CSS y JS sin paso de compilación

El mockup se reimplementa como `index.html`, `widget.css` y `widget.js`, con `livekit-client` (build UMD) y las fuentes Geist copiados en `widget/vendor/`.

- Por qué: el servicio es Python y no tiene toolchain de JS; la interfaz es pequeña; servir todo desde el mismo origen permite una CSP estricta.
- Alternativa: React con Vite. Se descarta porque añade un build al despliegue de Python sin aportar a una sola pantalla.
- `support.js` y `_ds_bundle.js` no se incorporan: son el runtime de Claude Design, no código de producción.

### 3. Tema oscuro con tokens copiados

Se copian los tokens necesarios de `:root` de `src/app/globals.css` a `widget/tokens.css`, indicando la fuente en un comentario. Correspondencia con el mockup:

| Mockup | Widget |
|---|---|
| Superficie del panel `--bg` | `--surface-card` |
| Fondo de mensajes y voz `--slate-50` | `--bg` |
| Burbuja de la persona `--navy-900` | `--action` / `--action-fg` |
| Burbuja de Edy | `--surface-card` + `--border` |
| Micrófono en reposo o escucha | `--action` |
| Micrófono respondiendo | `--accent` |
| Texto secundario | `--fg-2`, `--fg-3` |

- Por qué: la spec `design-system` exige un único tema oscuro, y el panel se ve sobre la plataforma.
- Alternativa: un paquete compartido de tokens. Es excesivo para dos repos y unos pocos valores; se acepta la posible divergencia.
- Los controles conservan la pareja `box-shadow: var(--ring)` + `outline: 2px solid transparent` y crecen a 44 px con `pointer: coarse`.

### 4. Puente `postMessage` con saludo inicial

La URL del iframe no lleva datos. Cada lado comprueba el origen del otro y envía con `targetOrigin` exacto.

| Dirección | Mensaje | Efecto |
|---|---|---|
| Plataforma a iframe | `edy:init` | Tras `load`; el iframe comprueba que el origen esté en `embedOrigins` y lo guarda como padre |
| Iframe a plataforma | `edy:ready` | Quita el estado de carga y cancela el temporizador de 10 s |
| Plataforma a iframe | `edy:focus` | Pone el foco en el campo o control activo |
| Plataforma a iframe | `edy:hidden` | Termina la sesión de voz activa |
| Iframe a plataforma | `edy:close` | Cierra el panel; se envía al pulsar Escape dentro del iframe |
| Iframe a plataforma | `edy:navigate` + `path` | La plataforma valida la lista de rutas y usa `router.push` |

- `onError` no sirve para detectar el fallo, porque un iframe bloqueado o con error HTTP sigue disparando `load`. Por eso se usa la confirmación `edy:ready`.
- `embedOrigins` llega en `GET /config`, junto con `platformUrl` y `voiceEnabled`. El iframe no toma su padre de la URL ni de `document.referrer`, que un atacante puede influir.
- La plataforma valida con una lista cerrada de rutas, porque su frontera de seguridad no debe depender del iframe. La expresión está anclada y exige un UUID, así que cubre lo que comprobaría `safeNextPath`, que además vive en un módulo solo de servidor.

### 5. Navegar con `router.push` y no con `target="_top"`

Un enlace con `target="_top"` recargaría la página y perdería la conversación. Los enlaces conservan un `href` real, y su clic se intercepta para enviar `edy:navigate`. Sin padre, como al abrir el widget directamente, abren en una pestaña nueva.

Permisos del iframe: `sandbox="allow-scripts allow-same-origin allow-forms"` y `allow="microphone; autoplay"`. `allow-same-origin` es necesario para que el widget conserve su propio origen; no le da acceso a la plataforma porque son orígenes distintos. Durante la implementación hay que verificar que el micrófono funcione con `sandbox` en Chrome, Firefox y Safari. Si un navegador lo impide, se retira `sandbox` y se mantienen CSP y validación de mensajes.

### 6. Panel persistente en el layout raíz

`AssistantWidget` es un componente cliente que se añade en `layout.tsx` en su propio `Suspense`, porque con `cacheComponents` `usePathname` suspende en rutas con parámetros dinámicos. Se monta sin iframe; este aparece en la primera apertura y luego se oculta con `hidden`, sin desmontarse.

- Bajo `/aprender` el botón y el panel se ocultan, pero el iframe no se desmonta, y se envía `edy:hidden`.
- El panel es no modal, sin trampa de foco, con `role="dialog"` y `aria-label`, porque debe permitir usar la página. En móvil ocupa la pantalla y queda cubierta; por eso, a pantalla completa, seguir un enlace cierra el panel para que se vea el destino.
- El botón de cerrar pertenece a una barra fina del panel y no al iframe, para que siga funcionando si este falla.
- El estado del panel no se persiste: al recargar la página empieza cerrado y sin conversación.

Debe leerse `node_modules/next/dist/docs/` antes de implementar, en especial el uso de `usePathname` con `cacheComponents: true` en un componente del layout.

### 7. `history` opcional en `/chat`

Se mantiene `message` y se añade `history: [{role: "user"|"assistant", content}]`, con un máximo de 12 turnos y 2000 caracteres por turno. Se validan con Pydantic y se insertan entre el prompt de sistema y el mensaje actual. Solo contienen texto: las llamadas a tools de turnos previos no se conservan.

- Por qué en el cliente: mantiene el servicio sin estado y sin datos de conversación que proteger.
- Alternativa: sesiones en el servidor. Se descarta porque exige almacenamiento y caducidad sin aportar a este alcance.
- Riesgo aceptado: el cliente puede falsificar turnos del asistente. Solo afecta a su propia conversación, y la única tool devuelve datos públicos.

### 8. Sesiones de voz

`POST /voice/token` genera una sala `edy-<uuid>` y un `AccessToken` de 10 minutos con permiso solo para esa sala, y devuelve `{url, token}`. Responde 503 si falta la configuración de LiveKit.

El worker se despacha automáticamente al crearse la sala y aplica la duración máxima (`VOICE_MAX_SECONDS`, 300 por defecto) con un temporizador que cierra la sesión. El TTL del token no sirve para esto, porque solo limita el acceso inicial y no corta una conexión ya establecida.

En el cliente:

- Los estados se derivan del atributo `lk.agent.state` del participante agente.
- La transcripción llega por el text stream `lk.transcription`.
- Se añade el estado "Pensando...", que el mockup no tiene, porque Gemini tarda de 7 a 9 s y el silencio parecería un fallo.
- Estos nombres se validan contra las versiones instaladas de `livekit-agents` y `livekit-client` antes de construir la interfaz (tarea 3.1).

### 9. Límites en memoria y sin dependencias nuevas

Se usa una ventana fija por IP en un módulo pequeño, con valores configurables:

| Límite | Valor por defecto |
|---|---|
| `/chat` por IP | 20 por minuto |
| `/voice/token` por IP | 5 cada 10 minutos |
| `/voice/token` global | 60 por hora |

- Por qué: basta para un único proceso y evita desplegar Redis.
- La IP real depende de ejecutar uvicorn con `--proxy-headers` y `--forwarded-allow-ips` limitado al proxy. Así, una cabecera `X-Forwarded-For` enviada por el cliente no puede saltarse el límite.

### 10. Cabeceras del widget

Un middleware añade a `/widget/*`:

```
Content-Security-Policy: default-src 'self';
  connect-src 'self' <LIVEKIT_URL wss y https>;
  media-src 'self' blob:; img-src 'self' data:;
  frame-ancestors <EMBED_ORIGINS>; base-uri 'none'; form-action 'self'
```

`EMBED_ORIGINS` es una lista separada por comas, con `PLATFORM_URL` como valor por defecto. Se configura en el `.env`, porque Playwright y las previews usan otros orígenes. Hay que verificar si `livekit-client` necesita además `worker-src`.

### 11. Textos y marca

El texto fijo del widget se escribe sin tildes, siguiendo la convención deliberada de la plataforma: "Hola, soy Edy, el asistente de EduTech. ¿Que quieres aprender?". Las respuestas del modelo pueden llevar tildes. La cabecera mantiene "Asistente EduTech", y `shared/system_prompt.py` y `shared/tools.py` cambian "Eduplatform" por "EduTech".

### 12. Pruebas

- **Plataforma:** Playwright con `NEXT_PUBLIC_EDY_URL=http://edy.test` en `webServer.env` y `page.route` para simular el widget. Así las pruebas no dependen de Edy ni de proveedores.
- **`edy-service`:** `pytest` con `TestClient`, modelo y token simulados, sin llamadas de red.
- **Voz real y micrófono:** verificación manual, porque dependen de servicios externos y de permisos del navegador.

## Risks / Trade-offs

- [Coste por uso abusivo: `/chat` y `/voice/token` son públicos] → Límites por IP, tope global de voz y duración máxima. Con IP rotativas el abuso sigue siendo posible hasta el tope global de voz; el chat no tiene tope global en esta versión.
- [`/api/courses/search` sigue sin límite y Edy aumenta su uso] → Queda fuera de alcance; conviene revisar su consumo tras el lanzamiento.
- [Reiniciar Edy o usar varias instancias pierde o divide los contadores en memoria] → Aceptado para esta versión. Con varias instancias habría que mover los límites a un almacén compartido.
- [El respaldo NVIDIA puede tardar más de un minuto] → Aviso a los 20 s y corte en el cliente a los 180 s, con reintento.
- [Los tokens copiados pueden divergir de la plataforma] → Comentario con la fuente en `tokens.css` y revisión al cambiar el design system.
- [El modelo puede devolver enlaces o texto arbitrarios] → Renderizado con nodos de texto, sin `innerHTML`, y enlaces solo hacia la plataforma.
- [El historial del chat no llega a la voz] → Aceptado. La transcripción sí pasa al chat al terminar.
- [Las cookies de terceros no se usan, pero algunos navegadores restringen funciones en iframes] → El widget no depende de cookies. El micrófono se verifica en los tres navegadores.
- [Sin HTTPS en producción, el navegador bloquea el micrófono] → Requisito de despliegue documentado; el texto sigue funcionando.

## Migration Plan

1. Confirmar los cambios pendientes de `edy-service` y desplegar el servicio y el worker con HTTPS, `EMBED_ORIGINS` y las credenciales de los proveedores.
2. Comprobar el widget directamente en `https://<edy>/widget/`.
3. Definir `NEXT_PUBLIC_EDY_URL` en la plataforma y desplegarla. Es pública y se incluye en el build, así que cambiarla requiere recompilar.

**Rollback:** eliminar `NEXT_PUBLIC_EDY_URL` y recompilar oculta el asistente. El cambio en `/chat` es compatible con clientes anteriores, así que Edy puede quedar desplegado.

## Open Questions

- Dónde se aloja Edy en producción y su URL final. No cambia el diseño: se configura con `NEXT_PUBLIC_EDY_URL`, `PLATFORM_URL` y `EMBED_ORIGINS`.
- Los valores finales de los límites, que dependen de la cuota contratada. Son configurables por entorno.
