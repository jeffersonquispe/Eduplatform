# Lighthouse movil - antes

Build de produccion local (`next start`), perfil movil por defecto de Lighthouse 12.8.2, 3 corridas por pagina; valores = mediana.

| Pagina | Ruta | Sesion | Rendimiento | LCP | CLS | Peso total |
|---|---|---|---|---|---|---|
| home | / | - | 88 (79-89) | 2.93 s | 0.001 | 257 KiB |
| cursos | /cursos | - | 88 (85-89) | 2.82 s | 0.000 | 258 KiB |
| curso-detalle | /cursos/[id] | - | 90 (89-91) | 2.88 s | 0.000 | 255 KiB |
| mis-cursos | /mis-cursos | student | 89 (83-95) | 2.81 s | 0.000 | 246 KiB |

Pendiente: leccion (`/aprender/[id]/[lessonId]`), porque el estudiante guardado no esta inscrito en ningun curso.
