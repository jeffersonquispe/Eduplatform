# Hallazgos de rendimiento (línea base «antes»)

Fuente: `reports/perf/antes/` (Lighthouse 12.8.2, perfil móvil, 3 corridas por página, build de producción local contra el Supabase real) más lectura del código. **No se ha cambiado código.**

## Cómo leer las cifras

- **Puntaje, LCP y peso** de la tabla de `summary.md` son los de Lighthouse con throttling *simulado* (4G lenta + CPU ×4). Ahí las cuatro páginas medidas salen casi iguales (LCP 2,8–2,9 s, ~250 KiB), así que **esa cifra no distingue entre páginas**.
- Lo que sí las distingue es el LCP *observado* (sin throttling, mismo informe: `metrics.observedLargestContentfulPaint`) y el momento en que termina el documento HTML (`network-requests[0].networkEndTime`). Los hallazgos usan ambos y lo indican.
- Los tiempos de servidor incluyen la latencia de la máquina local hacia Supabase: sirven para comparar antes/después, no como cifra de producción.

### Limitaciones de la medición

1. **`/aprender/[id]/[lessonId]` no está medida**: el estudiante guardado no tiene inscripciones. Lo que se dice de esa ruta viene solo de leer el código y está marcado como tal.
2. **`/mis-cursos` mide el estado vacío** (sin cursos) y con un token caducado: el JWT guardado en `playwright/.auth/student.json` expiró a las 00:43 UTC y se midió ~1,5 h después. Su TTFB de 462 ms (frente a 12–20 ms en las públicas) probablemente incluye un viaje de renovación a Supabase y no es representativo. Hay que volver a iniciar sesión (`e2e/auth.setup.ts`) antes de medir el «después».
3. La varianza entre corridas es alta en algunas páginas (home 79–89, `/mis-cursos` 83–95): conviene más de 3 corridas para comparar.

## Resumen por impacto

| # | Hallazgo | Páginas | Métrica | Impacto |
|---|---|---|---|---|
| 1 | Todo el cuerpo de la página espera a Supabase (sin `Suspense` interno) | `/`, `/cursos`, `/cursos/[id]`, `/mis-cursos` (+ lección por código) | LCP | Alto |
| 2 | Consultas encadenadas y duplicadas en el detalle y la lección | `/cursos/[id]`, `/aprender/...` (por código) | LCP / TTFB del contenido | Alto |
| 3 | «El taller del agente» re-renderiza todo el SVG 60 veces por segundo | `/` | TBT, INP, CPU/batería | Alto (en home) |
| 4 | JavaScript innecesario al inicio: chunk del taller arrastrado a otras páginas y widget del asistente en todas | todas | Peso JS, red al inicio | Medio |
| 5 | CSS único bloqueante del pintado | todas | FCP/LCP | Medio-bajo |
| 6 | Dos fuentes en todas las páginas; Geist Mono casi sin uso | todas | Ancho de banda inicial | Medio-bajo |
| 7 | Prefetch masivo y catálogo sin paginar | `/cursos`, `/` | Red, escalado | Bajo hoy / crece con el catálogo |
| 8 | `favicon.ico` de 15 KiB en cada página | todas | Peso | Bajo |

Revisado y **sin hallazgo**: imágenes pesadas o sin tamaño (ver al final), `font-display`, CLS.

---

## 1. Todo el cuerpo de la página espera a Supabase antes de pintar

- **Páginas afectadas:** `/`, `/cursos`, `/cursos/[id]`, `/mis-cursos`; por lectura de código también `/aprender/[id]` y `/aprender/[id]/[lessonId]`.
- **Métrica que daña:** LCP (y SI). El FCP es bueno (~0,17–0,28 s observado) porque solo pinta el cascarón del layout; el contenido propio llega mucho después.
- **Evidencia** (tres corridas por página; ms, sin throttling):

  | Página | Fin del documento | LCP observado | FCP observado |
  |---|---|---|---|
  | `/` | 649 – 1048 | 770 – 1231 | 165 – 275 |
  | `/cursos` | 1008 – 1167 | 1134 – 1246 | 181 – 206 |
  | `/cursos/[id]` | 981 – 1436 | 1054 – 1502 | 171 – 207 |
  | `/mis-cursos` | 1310 – 1667 | 1339 – 1674 | 432 – 875 |

  El LCP observado cae siempre 20–200 ms después del fin del documento: el elemento LCP llega con el último byte del HTML en streaming. Los elementos LCP son texto sin relación con imágenes: `<h1 class="text-3xl font-semibold">` en `/`, `<p class="mt-1 line-clamp-3 …">` (primera tarjeta) en `/cursos`, `<p class="mt-6 max-w-3xl …">` (descripción) en `/cursos/[id]`, `<p class="text-sm text-fg-3">` en `/mis-cursos`. En `/` incluso el `<h1>` estático espera: no depende de ningún dato.
- **Causa probable:**
  - [src/app/page.tsx:9-10](../../src/app/page.tsx#L9-L10), [src/app/cursos/page.tsx:11-19](../../src/app/cursos/page.tsx#L11-L19), [src/app/cursos/[id]/page.tsx:25-33](../../src/app/cursos/[id]/page.tsx#L25-L33), [src/app/mis-cursos/page.tsx:11-13](../../src/app/mis-cursos/page.tsx#L11-L13): el componente de página hace `await` de datos en el nivel superior, así que **toda la página** es el hueco dinámico; solo el layout (cabecera + `Suspense` raíz) entra en el cascarón estático.
  - Las cuatro páginas declaran `export const instant = false` (comentario: «la navegación puede esperar al servidor»), la salida explícita de la validación de navegación instantánea de Cache Components. Es una deuda de migración reconocida, no un olvido.
  - Los datos públicos (categorías, cursos publicados) se piden en cada petición; no hay `use cache`.
- **Propuesta de arreglo:**
  1. Dejar el contenido estático en el cascarón y mover cada lectura a un componente hijo dentro de su `<Suspense>` con el esqueleto que ya existe (`CourseGridSkeleton`, `loading.tsx`). Ejemplo: en `/` el `<h1>`, el CTA y el taller salen ya; categorías y cursos destacados hacen streaming. En `/cursos` el `<h1>` y el formulario de búsqueda salen ya y solo la rejilla espera.
  2. Opcional, segunda fase: cachear con `use cache` + `cacheLife`/`cacheTag` las lecturas públicas (categorías, destacados) e invalidarlas desde las acciones de publicar/editar.
- **Riesgo:**
  - (1) **Bajo-medio**: hay que reservar la altura del esqueleto para no introducir CLS (hoy es ~0) y cuidar los `e2e` que esperan la rejilla (`data-testid="course-card"`, `role="status"` del contador en `/cursos`).
  - (2) **Medio-alto**: `getPublishedCourses` usa la sesión del usuario y RLS también deja ver borradores propios; una versión cacheada tendría que usar un cliente anónimo y se arriesga a mostrar datos desfasados si falta invalidar. Decidirlo aparte.
- **Mejora esperada:** el LCP de `/` y `/cursos` pasaría del fin del documento (~0,65–1,2 s observado) al del cascarón (~0,2–0,3 s). Es una estimación a partir de las cifras anteriores, no está medida.

## 2. Consultas encadenadas y duplicadas en el detalle y la lección

- **Páginas afectadas:** `/cursos/[id]` (medida); `/aprender/[id]/[lessonId]` (solo por código, sin medir).
- **Métrica que daña:** tiempo hasta el contenido (determina el LCP, ver #1). El detalle es la página más lenta del grupo: fin de documento 981–1436 ms frente a 649–1048 ms del home, que reparte sus dos consultas con `Promise.all`.
- **Evidencia (código):**
  - [src/app/cursos/[id]/page.tsx:29-33](../../src/app/cursos/[id]/page.tsx#L29-L33): `getPublishedCourse` → `getCourseReviews` → `getCurrentUser` → `isEnrolled`, cuatro esperas seguidas. Las reseñas solo necesitan el `id` de la URL (ya validado), no el resultado de la consulta del curso; `getCurrentUser` ya la pide la cabecera.
  - [src/app/cursos/[id]/page.tsx:18-23](../../src/app/cursos/[id]/page.tsx#L18-L23): `generateMetadata` llama a `getPublishedCourse(id)` y la página vuelve a llamarla. **Corrección posterior, medida:** contando las peticiones reales a Supabase con un proxy local, el curso se pide **una sola vez**: Next memoiza el `fetch` idéntico entre metadata y página. No es un viaje duplicado hoy; `cache()` sería solo una garantía explícita.
  - [src/lib/learning.ts:44-56](../../src/lib/learning.ts#L44-L56) (`requireCourseAccess`): usuario → esquema del curso → `isEnrolled`; luego [src/app/aprender/[id]/[lessonId]/page.tsx:30](../../src/app/aprender/[id]/[lessonId]/page.tsx#L30) añade `getLessonContent`, y `generateMetadata` hace `getLessonTitle` aparte: hasta cinco viajes en serie para una lección.
- **Causa probable:** cada helper se escribió para ser legible y no para solaparse; la dependencia real entre consultas es mínima.
- **Propuesta de arreglo:** lanzar `getCourseReviews`, `getCurrentUser` y el curso con `Promise.all` (la inscripción, cuando ya se conoce el usuario); opcionalmente envolver `getPublishedCourse`, `getLessonTitle` y `getCourseTitle` con `React.cache` para no depender de la memoización de `fetch`; en la lección, lanzar `getLessonContent` en paralelo con la comprobación de acceso (RLS ya protege el contenido).
- **Riesgo:** **Bajo** para los `Promise.all` y `cache()`. **Medio** para solapar `getLessonContent` con el control de acceso: no es un riesgo de seguridad porque RLS es la barrera real, pero cambia el orden en que se muestran los redirects, así que hay que mantener los tests de `e2e/enrollment.spec.ts` y `src/lib/enrollment.integration.test.ts` verdes.

## 3. «El taller del agente» re-renderiza todo el SVG 60 veces por segundo

- **Página afectada:** `/` (solo).
- **Métrica que daña:** TBT e INP; trabajo continuo del hilo principal tras la carga (CPU, batería en móvil). En Lighthouse el TBT mediano no destaca (322 ms frente a 190–490 en el resto) porque se mide solo hasta TTI y la animación sigue después, pero la corrida 1 del home sacó TBT 599 y puntaje 79.
- **Evidencia (home-run2.json, mismo chunk de React en todas las páginas):**
  - Tiempo de script en el chunk de React (`2ki52vdnbo2ft.js`): **4067 ms en `/`** frente a 490–549 ms en `/cursos`, `/cursos/[id]` y `/mis-cursos`.
  - `mainthread-work-breakdown`: scriptEvaluation 4443 ms (resto 778–814) y styleLayout 2085 ms (resto 205–406).
  - Dos tareas largas atribuidas a ese chunk (318 y 157 ms) poco después de la carga (compatible con la hidratación y los primeros fotogramas; no lo he separado).
  - El único desplazamiento de layout (0,0006) es el botón «Activar sonido» del taller (`button.eb-btn`, y=679–723, dentro de la primera pantalla de 823 px): el taller **está a la vista al cargar en móvil**, y por eso el `IntersectionObserver` lo deja correr.
- **Causa probable** ([src/components/taller-agente.tsx:343-371](../../src/components/taller-agente.tsx#L343-L371) y 315-340): un `requestAnimationFrame` llama a `setT` en cada fotograma; cambia el estado del componente raíz y se vuelve a renderizar `Piece` y `World` completos (todo el SVG isométrico, con decenas de `<Box>`, `<polygon>`, libros, engranajes, partículas) sin memoización de las partes que no cambian. React hace el diff de cientos de nodos por fotograma.
- **Propuesta de arreglo (de menor a mayor cambio):**
  1. Cargarlo con `next/dynamic` (envoltorio cliente) y que no arranque solo: poster estático o `Reproducir` explícito, o arrancar con `requestIdleCallback` y solo si no hay `prefers-reduced-motion`.
  2. Bajar el reloj a ~30 fps o sacar `T` del estado de React (actualizar atributos del SVG por `ref`) para no re-renderizar el árbol.
  3. `memo` en las piezas que dependen de `a`/`t` solo parcialmente.
- **Riesgo:** **Medio**. Cambia la experiencia visible (la animación deja de arrancar sola) y el archivo está marcado como código portado (`@ts-nocheck`, sin tipos): tocarlo a fondo es arriesgado, por eso se propone empezar por (1). Ningún test en `e2e/` hace referencia al taller (comprobado con grep), pero conviene un test de humo para el botón de reproducir.

## 4. JavaScript innecesario al inicio

- **Páginas afectadas:** todas. El JS es el 60 % del peso de cada página (152–155 KiB de ~250 KiB; Lighthouse marca 26–29 KiB sin usar del chunk de React).
- **Métrica que daña:** peso transferido y ancho de banda disputado en los primeros 500 ms; TBT.
- **Evidencia:**
  - **El chunk del taller se descarga en páginas que no lo usan.** `3mqd2ab5py_ye.js` (38,8 KB sin comprimir, 13 KiB transferidos; contiene «Activar sonido» y `AudioContext`) aparece en `/cursos`, `/cursos/[id]` y `/mis-cursos` entre los 432 y 439 ms, justo después de las peticiones `/?_rsc=…`. Es el prefetch del enlace a `/` de la cabecera, que arrastra el JS de la ruta de destino.
  - **Código de audio en la carga inicial del home** aunque el sonido está desactivado por defecto (`auInit()` solo se llama al pulsar).
  - **`AssistantWidget` en el layout raíz**: su chunk (`2rbcinzew-ncr.js`, 25 KB sin comprimir, 8 KiB transferidos, contiene «Asistente», `edy:navigate` y `NavLink`) se baja y se hidrata en todas las páginas, con `usePathname`/`useRouter`. Con `NEXT_PUBLIC_EDY_URL` definido (el caso de `.env.local`) monta el botón en cada página.
  - Parte del resto es el *runtime* de React (72 KiB) y del router de Next (46 KiB), fuera del alcance del código de la app.
- **Causa probable:** el taller es un componente cliente importado estáticamente por [src/app/page.tsx:3](../../src/app/page.tsx#L3); el widget se importa directamente en [src/app/layout.tsx:6](../../src/app/layout.tsx#L6). No hay división de código por interacción.
- **Propuesta de arreglo:** `next/dynamic` para el taller; dentro de él, importar el módulo de audio (`auInit`, `musicTick`, `SFX`) con `import()` al pulsar «Activar sonido»; montar el widget con carga diferida (`dynamic` o tras `requestIdleCallback`) y mantener el iframe diferido como ya está. En el enlace «Inicio» de la cabecera, valorar `prefetch={false}`.
- **Riesgo:** **Bajo-medio**. `e2e/assistant.spec.ts` simula el widget con `page.route`: una carga diferida puede obligar a esperar el botón; el audio diferido añade un pequeño retardo al primer clic.

## 5. CSS único bloqueante del pintado

- **Páginas afectadas:** todas.
- **Métrica que daña:** FCP y LCP (retraso estimado por Lighthouse: 168–182 ms por página).
- **Evidencia:** `render-blocking-insight` lista un único recurso, `/_next/static/chunks/0qmg0wpe_9q23.css` (9,1 KiB transferidos, 39,7 KB sin comprimir), pedido a los 63–73 ms y servido en ~25–30 ms; el pintado no empieza hasta que llega. `unused-css-rules` no marca desperdicio relevante.
- **Causa probable:** una hoja global (`globals.css`, 236 líneas más utilidades de Tailwind) cargada con `<link rel="stylesheet">` como indica el comportamiento por defecto de Next.
- **Propuesta de arreglo:** probar `experimental.inlineCss` en `next.config.ts` (documentado en `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/inlineCss.md`), que incrusta el CSS en el HTML.
- **Riesgo:** **Medio**. Es experimental; el CSS se repite en cada respuesta HTML (más bytes de documento, ya que no se cachea aparte) y puede interactuar con el cascarón estático de PPR. Hay que medirlo antes de adoptarlo: la ganancia teórica es de ~170 ms de FCP, pero el peso del documento sube ~9 KiB.

## 6. Dos fuentes en todas las páginas; Geist Mono casi sin uso

- **Páginas afectadas:** todas.
- **Métrica que daña:** ancho de banda disputado al inicio (no bloquea el pintado del texto).
- **Evidencia:** dos `woff2` por página (23,4 KiB + 29,6 KiB = 51,8 KiB, un 20 % del peso) pedidos a los 36–52 ms, a la vez que el CSS y los scripts. Los `@font-face` tienen `font-display: swap` (11 apariciones en el CSS compilado), así que **no bloquean el texto** y no hay desplazamiento visible (CLS ≈ 0). El token `--font-mono` ([src/app/globals.css:94](../../src/app/globals.css#L94)) no lo usa ninguna clase ni componente en `src/` (grep); su único consumidor real son las etiquetas del SVG del taller, que escriben `'Geist Mono'` a mano. Es decir, 29,6 KiB de media por página se precargan para texto que solo existe en `/`.
- **Causa probable:** [src/app/layout.tsx:8-16](../../src/app/layout.tsx#L8-L16) declara `Geist` y `Geist_Mono` con la precarga por defecto de `next/font` en el layout raíz.
- **Propuesta de arreglo:** `preload: false` en `Geist_Mono` (se descargará solo si alguna regla CSS la necesita) o eliminarla si el taller puede usar `ui-monospace`. Valorar `subsets` e `weight` si Geist es variable y se usa un solo peso.
- **Riesgo:** **Bajo**. Posible parpadeo de fuente en las etiquetas mono del SVG del taller la primera vez que se pinten.

## 7. Prefetch masivo y catálogo sin paginar

- **Páginas afectadas:** `/cursos` (más), `/` y el resto.
- **Métrica que daña:** red y CPU en los primeros 1,5 s; escalado con el tamaño del catálogo. Hoy es pequeño en bytes (1–2 KiB por petición).
- **Evidencia:** peticiones `Fetch` (RSC) por página: `/` 8, `/cursos` 15, `/cursos/[id]` 12, `/mis-cursos` 6 (7–16 KiB en total). Cada enlace de la cabecera se pide dos veces (~300 y ~380 ms). En `/cursos`, siete peticiones más a ~1,1 s corresponden a los enlaces `/cursos/<id>` y `/instructores/<id>` de cada tarjeta.
  - [src/lib/courses.ts:58-88](../../src/lib/courses.ts#L58-L88): `getPublishedCourses` no tiene `limit`; `/cursos` pinta todas las filas (168 nodos con 10 cursos).
  - [src/components/featured-courses.tsx:7](../../src/components/featured-courses.tsx#L7): el home trae **todo** el catálogo para quedarse con `courses.slice(0, 3)`.
- **Causa probable:** prefetch automático de `<Link>` en el viewport y una consulta pensada para el catálogo completo reutilizada en el home.
- **Propuesta de arreglo:** parámetro `limit` en `getPublishedCourses` (3 en el home); paginación o «cargar más» en `/cursos`; `prefetch={false}` en los enlaces de instructor de las tarjetas.
- **Riesgo:** **Bajo** para el `limit` del home; **medio** para paginar `/cursos` (`e2e/catalog.spec.ts` comprueba que solo salen cursos publicados, el filtro por categoría, la búsqueda y el estado vacío; habría que revisar que ninguno dependa de ver todo el catálogo en una página). `prefetch={false}` puede hacer más lenta la primera navegación a esa ruta.

## 8. `favicon.ico` de 15 KiB

- **Página afectada:** todas.
- **Métrica:** peso total (6 % del total); se pide después del LCP (a ~760–1330 ms), por lo que no frena el pintado.
- **Evidencia:** [src/app/favicon.ico](../../src/app/favicon.ico) = 15 086 bytes; aparece como `Other` de 15 KiB en cada informe.
- **Propuesta de arreglo:** sustituir por un `icon.svg` o un PNG pequeño en `src/app/`.
- **Riesgo:** **Muy bajo** (comprobar el favicon en Safari, que prefiere PNG).

---

## Revisado sin hallazgo

- **Imágenes pesadas o sin tamaño:** ninguna. En los cuatro informes no hay ni una petición de imagen real (`Image` = 0 KiB; solo dos `data:image/svg+xml` en el home). Las tarjetas del home usan una ilustración SVG en línea generada por `coursePlaceholder` ([src/lib/course-placeholder.ts](../../src/lib/course-placeholder.ts)); el `<img>` lleva `width={400} height={160}`, `unsized-images` y `uses-responsive-images` salen vacíos y los elementos LCP son texto. Riesgo latente: ese SVG va incrustado como texto en el HTML y se repite en la carga útil RSC (HTML + payload); si algún día los cursos tienen imágenes reales habrá que usar `next/image` con `sizes` y prioridad para la primera.
- **Fuentes que bloquean el pintado:** no; `font-display: swap`, sin `font-display` en `font-display` audit, sin CLS por la sustitución. El problema de fuentes es de peso (#6), no de bloqueo.
- **CLS:** 0,000–0,001 en todas. La cabecera tiene un fallback de 49 px y las tarjetas de carga reservan sus medidas.
- **TTFB del cascarón:** 12–20 ms en las páginas públicas (`server-response-time`).

## Qué haría primero

1. **#1 + #2** (mismo trabajo en las mismas páginas, riesgo bajo-medio): es lo que más acerca el LCP al FCP.
2. **#3 y #4** juntos: aislar el taller del camino crítico (`dynamic`, audio bajo demanda) resuelve la CPU del home y de paso deja de arrastrar su chunk a las demás páginas.
3. **#6** (una línea) y **#7** (el `limit` del home) como arreglos baratos.
4. **#5** solo si, tras lo anterior, el CSS sigue siendo el techo del FCP; medir antes y después.

Antes de medir el «después»: renovar las sesiones guardadas, inscribir al estudiante de pruebas en un curso para poder medir la lección y subir a más de 3 corridas en `/` y `/mis-cursos`.
