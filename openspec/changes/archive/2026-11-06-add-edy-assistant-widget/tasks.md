> Las rutas de los grupos 1 a 6 están en `C:\Users\Jeff\Desktop\sesion 8\edy-service`, un repo aparte. Editarlas requiere la autorización explícita del usuario.

## 1. Preparar `edy-service`

- [x] 1.1 Pedir al usuario que confirme o autorice el commit de `voice/`, `requirements.txt` y `.env.example`, que están pendientes, y verificar con `git status` que el trabajo parte de una base limpia
- [x] 1.2 Añadir `livekit-api` a `requirements.txt` y crear `requirements-dev.txt` con `pytest`, y verificar que `pip install` termina y `pytest --version` funciona
- [x] 1.3 Crear el módulo de configuración de `EMBED_ORIGINS` (con `PLATFORM_URL` por defecto) y los límites, añadirlos a `.env.example`, y verificar con una prueba que los valores se interpretan correctamente

## 2. Conversación de texto con historial

- [x] 2.1 Ampliar `ChatRequest` con `history` opcional, validado por rol, número de turnos y longitud, e insertarlo entre el prompt y el mensaje; verificar con pruebas de la spec: solo `message`, seguimiento con historial y 422 en rol no permitido o exceso, sin llamar al modelo
- [x] 2.2 Añadir el limitador de ventana fija y aplicarlo a `/chat`; verificar con una prueba que al superar el límite responde 429 sin llamar al modelo
- [x] 2.3 Cambiar "Eduplatform" por "EduTech" en `shared/system_prompt.py` y `shared/tools.py`, añadir que no tiene detalles de lecciones si faltaba, y verificar con `grep` que no queda la marca anterior

## 3. Sesiones de voz

- [x] 3.1 Comprobar en las versiones instaladas de `livekit-agents` y `livekit-client` el atributo de estado del agente, el canal de transcripción y el despacho automático; registrar en `design.md` cualquier diferencia
- [x] 3.2 Implementar `POST /voice/token` con sala nueva, token de 10 minutos limitado a esa sala, 503 sin configuración y límites por IP y global; verificar con pruebas que decodifican el token y comprueban 503 y 429
- [x] 3.3 Aplicar la duración máxima de sesión en `voice/main.py` con `VOICE_MAX_SECONDS`; verificar con una sesión real y un límite corto que la sesión se cierra

## 4. Publicación y seguridad del widget

- [x] 4.1 Servir `widget/` en `/widget/` y añadir `GET /config` con `embedOrigins`, `platformUrl` y `voiceEnabled`; verificar con pruebas de `TestClient` que ambas rutas responden con independencia del directorio de trabajo
- [x] 4.2 Añadir la CSP con `frame-ancestors` a `/widget/*`; verificar con una prueba las cabeceras y, en el navegador, que un origen autorizado carga la página y otro queda bloqueado

## 5. Interfaz del widget

- [x] 5.1 Crear `index.html` y `widget.css` con los tokens oscuros, Geist local, cabecera, conmutador y vistas del mockup; verificar visualmente a 400x680 y 375 px, y comprobar el foco, los 44 px táctiles y la ausencia de colores fuera de los tokens
- [x] 5.2 Implementar en `widget.js` el modo texto con saludo, chips, envío con Enter, historial limitado a 12 turnos y región `aria-live`; verificar contra `/chat` real o simulado que una pregunta de seguimiento conserva el contexto
- [x] 5.3 Implementar los estados de espera, aviso a los 20 s, corte a los 180 s, error con reintento sin duplicar, 429 y cambio de "En linea" a "Sin conexion"; verificar forzando cada respuesta con un servidor simulado
- [x] 5.4 Implementar el renderizado seguro con nodos de texto y enlaces solo a la plataforma; verificar con entradas que contengan `<script>`, una URL externa y una URL de curso
- [x] 5.5 Implementar el puente con `edy:init`, `edy:ready`, `edy:focus`, `edy:hidden`, `edy:close` y `edy:navigate`; verificar con una página de prueba que se ignoran orígenes no autorizados
- [x] 5.6 Implementar el modo voz con sus estados, transcripción, micrófono con `aria-label`, `prefers-reduced-motion` y cierre al ocultarse; verificar en el navegador una sesión real completa
- [x] 5.7 Implementar los fallos de voz: micrófono denegado, 503, 429, agente sin unirse en 15 s y fin por duración; verificar cada uno con el worker detenido, el permiso denegado o el límite reducido
- [x] 5.8 Añadir la transcripción final al chat al terminar la voz; verificar que el siguiente `/chat` la incluye en `history`

## 6. Pruebas y documentación de `edy-service`

- [x] 6.1 Ejecutar la suite completa con `pytest` y verificar que pasa sin red ni claves de proveedores
- [x] 6.2 Documentar en `README.md` y `CLAUDE.md` el widget, las variables, los procesos a ejecutar y el requisito de HTTPS; verificar siguiendo el README desde un entorno limpio

## 7. Panel en la plataforma

- [x] 7.1 Leer en `node_modules/next/dist/docs/` lo relativo a `usePathname`, componentes cliente en layouts y `cacheComponents`; verificar con `npm run build` que el componente añadido al layout no rompe el prerenderizado
- [x] 7.2 Añadir `NEXT_PUBLIC_EDY_URL` a `.env.example` y las clases `.eb-assistant-*` a `globals.css` usando tokens, con foco, 44 px táctiles, tamaño de escritorio y pantalla completa hasta 480 px; verificar a 1280 y 375 px sin desplazamiento horizontal
- [x] 7.3 Crear `src/components/assistant-widget.tsx` con botón, panel no modal, iframe diferido y mantenido montado, atributos `sandbox`, `allow` y `title`, y añadirlo a `layout.tsx`; verificar en el navegador que no se pide nada a Edy hasta abrirlo y que sin la variable no aparece
- [x] 7.4 Implementar el puente con validación exacta de origen, lista cerrada de rutas y `router.push`; verificar con los e2e de la tarea 8.2
- [x] 7.5 Implementar el cierre con botón y Escape, el retorno del foco, `edy:hidden` y la ocultación bajo `/aprender`; verificar con los e2e de la tarea 8.2
- [x] 7.6 Implementar el estado de carga, el aviso a los 10 s y "Reintentar" que recarga el iframe; verificar con los e2e de la tarea 8.2

## 8. Pruebas y cierre en la plataforma

- [ ] 8.1 Definir `NEXT_PUBLIC_EDY_URL=http://edy.test` en `webServer.env` de `playwright.config.ts` y un helper con `page.route` que simule el widget; verificar que los specs existentes siguen pasando
- [x] 8.2 Crear `e2e/assistant.spec.ts` para los escenarios de `assistant-widget`: carga diferida, conservación al navegar, origen falso, ruta no permitida, cierre, foco, `/aprender`, fallo de carga y móvil; verificar con `npx playwright test e2e/assistant.spec.ts`
- [x] 8.3 Añadir `Asistente EduTech chatbot/` y `Asistente EduTech chatbot.zip` a `.gitignore`, y verificar con `git status` que no aparecen
- [x] 8.4 Documentar el widget, el puente y la variable en `CLAUDE.md`, y verificar que `npm run lint` y `npm run build` pasan

## 9. Verificación integrada

- [x] 9.1 Con la plataforma, Edy y el worker en local, hacer una conversación de texto con seguimiento, seguir un enlace a un curso sin perder el hilo y comprobar que `search_courses` devuelve cursos reales
- [ ] 9.2 Hacer una sesión de voz completa desde el panel, cerrar el panel y comprobar que el indicador de micrófono del navegador se apaga
- [ ] 9.3 Comprobar el micrófono con `sandbox` en Chrome, Firefox y Safari sobre HTTPS, y aplicar la alternativa de `design.md` si alguno lo impide
- [ ] 9.4 Ejecutar `openspec validate add-edy-assistant-widget --strict` y `npx playwright test`, y verificar que ambos pasan
