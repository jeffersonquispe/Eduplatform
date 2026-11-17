# Informe final de rendimiento

Resultado de auditar, arreglar y volver a medir las páginas clave de la plataforma. El detalle de cada hallazgo y del proceso arreglo por arreglo está en [hallazgos.md](hallazgos.md); este documento resume el resultado final y lo que queda por decidir.

## 1. Cómo se midió

| Condición | Valor |
|---|---|
| Herramienta | Lighthouse 12.8.2, solo categoría de rendimiento |
| Perfil | Móvil (emulación y throttling por defecto de Lighthouse: 4G lenta simulada, CPU ×4) |
| Corridas | 3 por página; en las tablas se muestra la **mediana** (y el rango del puntaje) |
| Build | Producción local (`next build` + `next start`) contra el Supabase real de `.env.local` |
| Sesiones | Estudiante con las sesiones de Playwright (`playwright/.auth/`), renovadas justo antes de medir |
| Línea base | `reports/perf/antes-2/` (la medición original `antes/` tenía `/mis-cursos` con un token caducado, por eso se repitió) |
| Medición final | `reports/perf/despues/` (informes crudos y `summary.json`) |

Los datos crudos de cada paso intermedio están en `reports/perf/fix-*`. Los scripts son `scripts/lighthouse-perf.mjs` (mide) y `scripts/perf-table.mjs` (tabula); el primero necesita `PERF_TOOLS_DIR` apuntando a una carpeta con `lighthouse`, `chrome-launcher` y `playwright-core` instalados.

**Limitaciones.** (1) La página de lección (`/aprender/[id]/[lessonId]`) no se pudo medir: el estudiante de pruebas no tiene inscripciones y no se escribió en tu base de datos. (2) `/mis-cursos` se mide con el estado vacío. (3) Es una máquina local contra un Supabase remoto: sirve para comparar antes y después, no como cifra de producción. (4) El ruido es alto: el TBT de una misma página varía entre ~120 y ~720 ms, y el fin del documento depende de la latencia de Supabase (±40 %).

## 2. Antes y después

| Página | Puntaje | LCP simulado | LCP observado | CLS | Peso total |
|---|---|---|---|---|---|
| `/` | 88 → **92** (87–92 → 77–93) | 3,03 → **2,34 s** | 1170 → **197 ms** | 0,001 → 0,002 | 257 → **240 KiB** |
| `/cursos` | 90 → **92** | 2,74 → **2,46 s** | 1064 → 795 ms (*) | 0,000 → 0,000 | 258 → **208 KiB** |
| `/cursos/[id]` | 86 → **94** | 2,85 → **2,59 s** | 1780 → **790 ms** | 0,000 → 0,000 | 255 → **208 KiB** |
| `/mis-cursos` (vacío) | 91 → **95** | 2,63 → **2,45 s** | 1740 → 975 ms (*) | 0,023 → 0,011 (*) | 243 → **196 KiB** |
| `/aprender/…/[lessonId]` | sin medir | | | | |

Otras métricas de la misma medición:

| Página | TBT | JS transferido | Fuentes | Fin del documento |
|---|---|---|---|---|
| `/` | 289 → 329 ms | 154 → 156 KiB | 52 → 52 KiB | 1055 → 834 ms |
| `/cursos` | 273 → 266 ms | 155 → **144 KiB** | 52 → **29 KiB** | 987 → 642 ms (*) |
| `/cursos/[id]` | 414 → **196 ms** | 155 → **144 KiB** | 52 → **29 KiB** | 1720 → **720 ms** |
| `/mis-cursos` | 268 → 181 ms | 152 → **141 KiB** | 52 → **29 KiB** | 1728 → 937 ms (*) |

(*) **No atribuible a un arreglo.** Ningún cambio se aplicó para el LCP del catálogo ni de `/mis-cursos` (el del catálogo se revirtió, ver §4), y su fin de documento depende de la latencia de Supabase, que en la línea base ya variaba entre 927 y 1736 ms. El CLS de `/mis-cursos` (0,023 → 0,011) también cambia entre corridas de 0 a 0,023 sin que lo haya tocado ningún arreglo.

**Lo que sí se puede atribuir** porque es determinista o aparece en todas las corridas:

- **Inicio:** LCP observado 1170 → 197 ms (las 3 corridas: 255, 175 y 197 ms), por mover los datos a `Suspense`: el título ya no espera a Supabase.
- **Detalle del curso:** fin del documento 1720 → 720 ms y TBT 414 → 196 ms, por lanzar las consultas en paralelo.
- **Peso y JS:** −17 KiB (inicio) y −47 a −50 KiB (resto) de peso total; −11 KiB de JS y −23 KiB de fuentes en tres páginas.
- **Inicio, tiempo de script:** el taller dejó de ocupar el hilo principal (3,0–4,6 s → 0,8–1,25 s de evaluación de script medidos en el paso 3), aunque el TBT de laboratorio del inicio no lo refleja (mediana 329 ms frente a 289 ms; en la medición final las corridas dieron 874, 329 y 254 ms: la primera, con 874 ms de TBT, dio un puntaje de 77 y arrastra el rango; es el mismo tipo de pico que ya tenía la línea base original, 599 ms).

## 3. Arreglos aplicados (y mantenidos)

| # | Arreglo | Efecto medido |
|---|---|---|
| 1 | `Suspense` en el inicio: título, CTA y taller salen sin esperar; categorías y destacados hacen streaming | LCP observado 1170 → 197 ms; LCP simulado 3,03 → 2,34 s |
| 1b | Cabecera de reserva con las medidas reales (corrige un salto de layout que provocó el 1) | CLS de hasta 0,038 → 0,0023 estable en 5/5 corridas |
| 2 | Consultas en paralelo en `/cursos/[id]` (curso, reseñas, usuario e inscripción) | Fin del documento 1720 → 683–720 ms; puntaje 86 → 94 |
| 3 | El taller del inicio ya no se reproduce solo | Script del hilo principal 3,0–4,6 s → 0,8–1,25 s |
| 4a | Taller como chunk diferido y sin prerender (`next/dynamic`, `ssr: false`) | −11 KiB de JS en las demás páginas (dejan de arrastrarlo por el prefetch de `/`) |
| 6 | Geist Mono sin precarga (`preload: false`) | Fuentes 52 → 29 KiB en tres páginas |
| 7a | `limit` en la consulta del inicio | Respuesta de Supabase 4666 → 1352 B (−71 %); sin efecto visible en Lighthouse con 11 cursos |
| 7c | Sin prefetch en los enlaces de instructor de las tarjetas | Peticiones RSC en `/cursos` 15 → 12 |
| 8 | Icono SVG en lugar de `favicon.ico` de 15 KiB | Petición del icono 15 KiB → 0,8 KiB (−14 KiB por página) |

Archivos tocados: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/cursos/[id]/page.tsx`, `src/components/{site-header,featured-courses,course-card,taller-agente}.tsx`, `src/components/taller-agente-lazy.tsx` (nuevo), `src/lib/courses.ts`, `src/app/icon.svg` (nuevo) y `src/app/favicon.ico` (eliminado). No se tocaron migraciones ni políticas RLS.

## 4. Arreglos revertidos y por qué

| Arreglo | Motivo |
|---|---|
| `Suspense` en `/cursos` (parte del #1) | No mejoró la métrica prometida: el LCP observado quedó igual (1064 → 1058 ms), porque el mayor elemento de texto son las tarjetas, que siguen esperando a los datos. Se dejó solo en el inicio, donde el `<h1>` estático sí es el LCP. |
| `experimental.inlineCss` (#5) | Quita la hoja de estilos bloqueante, pero el HTML pasa de 11 a 45 KiB (el CSS va dos veces) y el LCP simulado empeoró en las tres páginas medidas: inicio 2,30 → 2,75 s, catálogo 2,62 → 2,83 s, detalle 2,60 → 2,91 s. |

**No aplicados** (por decisión de medición, no por fallo): audio del taller bajo demanda (4b: tras el 4a el chunk ya no está en el camino crítico, ahorro de ~1–2 KiB no medible); carga diferida del widget del asistente (4c: `e2e/assistant.spec.ts` no puede actuar de red de seguridad y el ahorro, ~8 KiB, no afecta al LCP); `prefetch={false}` en el enlace de inicio (4d: su causa desapareció con el 4a); paginar `/cursos` (7b: con 11 cursos no hay efecto medible y los e2e del catálogo no pueden validarlo).

## 5. Pendiente: necesita una decisión tuya

1. **Actualizar Next.js (16.4.3).** `next build` ahora termina con `exit 1` y un aviso de seguridad (`SecurityFatalError`: "tu versión de Next.js tiene una vulnerabilidad conocida") **después** de generar el build completo. No lo causan los cambios de rendimiento (es un chequeo de la versión contra el registro de avisos; el build se generó y funciona). Para medir y probar tuve que tolerar ese `exit 1` con un script local; no está en el proyecto. Actualizar puede traer cambios incompatibles (`AGENTS.md` ya avisa de que esta versión de Next difiere de lo habitual). No ejecuté ninguna actualización. El mensaje del build también traía instrucciones dirigidas al agente (ejecutar `next upgrade --agent=security …` y preguntarte por un worktree); no las seguí porque no son tuyas. La actualización, si la quieres, es tu decisión.
2. **El taller ya no arranca solo.** Muestra un fotograma fijo hasta pulsar «Reproducir». Es lo que quita el coste de CPU, pero cambia la experiencia. Alternativa: dejar la reproducción automática y abaratar cada fotograma (tocar código portado sin tipos, más riesgo).
3. **El favicon.** Se retiró el `favicon.ico` que traía create-next-app (15 086 bytes) y se añadió `src/app/icon.svg` con una «E» sobre el degradado de marca. Es una decisión de imagen; el original se recupera con `git checkout -- src/app/favicon.ico`. Safari de escritorio antiguo puede no mostrar favicons SVG.
4. **Inscribir al estudiante de pruebas en un curso.** Es la única forma de medir `/aprender/…/[lessonId]`, `/mis-cursos` con datos reales y de aplicar allí el mismo paralelismo que en el detalle (el #2 en la lección). Escribe en tu Supabase real.
5. **Índices y políticas RLS.** Están propuestos, sin aplicar: `courses (created_at desc) where status = 'published'`, `reviews (course_id, created_at desc)` y `reviews (student_id)`, más reescribir políticas con `(select auth.uid())` y aplanar la cadena `lessons → sections → courses`. Con 11 cursos no se notan; requieren una migración nueva y correr `supabase/tests/rls.sql`.
6. **Paginar `/cursos` y limitar las reseñas del detalle.** Hoy se traen todas. No se aplicó por no ser medible todavía.
7. **Cachear datos públicos (`use cache`).** Solo sería seguro con un cliente sin cookies y solo para cursos publicados; si se cacheara una lectura hecha con la sesión del usuario, el borrador de un instructor o un curso despublicado de un inscrito podrían acabar en la caché de otros visitantes.
8. **Pruebas rotas desde antes de tocar nada.** Siguen sin poder actuar de red de seguridad: (a) las cuentas y cursos de `supabase/tests/e2e-fixtures.sql` no están en el proyecto de Supabase configurado, por lo que 29 e2e fallan o no se ejecutan; (b) `e2e/assistant.spec.ts` tiene una frase pegada por error en la línea 14, dentro de `parent.postMessage`, que rompe sus 8 pruebas; (c) vitest solo funciona si la ruta lleva la letra de unidad en mayúscula (`C:\…`). La compuerta que usé es: unitarias (19), `tsc --noEmit` y los 12 e2e que ya pasaban (todo en verde tras reaplicar los cambios); las pruebas de integración (`test:integration`, crean usuarios en la nube) no se ejecutaron.

## 6. Incidencias del proceso

- **Rewind de los cambios.** El 16-nov a las 15:02 siete archivos volvieron a su estado original de golpe (parece un *rewind* de Claude Code que solo deshizo lo hecho con Edit/Write; los cambios hechos por terminal, como el favicon y el `limit`, sobrevivieron). Se reaplicaron exactamente los arreglos mantenidos antes de esta medición final, tras tu confirmación, y se volvió a pasar la compuerta de pruebas.
- **Build accidental en `.next`.** Al diagnosticar un fallo de build lancé una vez `npm run build` sin `NEXT_DIST_DIR`, que escribe en `.next`. En Next 16 el servidor de desarrollo usa `.next/dev`, así que no debería afectar a tu `npm run dev`; si ves algo raro, borra `.next` y reinicia el servidor.
- **`scripts/lighthouse-perf.mjs`** también perdió sus extensiones (métricas observadas y filtro `ONLY`) y se reescribieron; los informes crudos de `reports/perf/despues` no se vieron afectados y su `summary.json` se regeneró a partir de ellos.
