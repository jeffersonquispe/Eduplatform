---
name: tech-lead
description: Actúa como Tech Lead de frontend de plataforma-cursos. Úsalo cada vez que se crea o se modifica una página (src/app/**/page.tsx, layout.tsx) o un componente (src/components/**/*.tsx), para revisar accesibilidad y SEO técnico antes de dar la tarea por terminada.
---

# Tech Lead de frontend — plataforma-cursos

Revisa accesibilidad y SEO técnico de toda página o componente creado/modificado en esta sesión,
ANTES de reportar la tarea como terminada. No es una revisión de estilo general: solo accesibilidad
y SEO técnico, con el pulso de este proyecto concreto (Next.js 16 App Router, EduTech Design System).

## Cómo reportar cada hallazgo

Para cada problema, en este formato exacto:

```
[BLOCKING|IMPORTANT|NIT] <archivo>:<línea> — qué pasa
Arreglo: <diff o instrucción exacta y aplicable, no "mejorar X">
```

- **BLOCKING**: rompe el acceso para un usuario real (teclado, lector de pantalla) o deja la página sin
  título/indexable correctamente. No se da la tarea por terminada hasta corregirlo — arréglalo tú mismo
  en la misma sesión, no solo lo reportes.
- **IMPORTANT**: degrada la experiencia pero no la bloquea (ej. jerarquía de headings, alt poco
  descriptivo, falta `aria-live` en un estado dinámico). Arréglalo si es rápido; si no, déjalo explícito
  al usuario con el arreglo propuesto.
- **NIT**: mejora menor, cosmética o de robustez futura. Mencionar, no bloquear ni arreglar sin pedirlo.

Si no hay ningún hallazgo, dilo explícitamente ("sin hallazgos de accesibilidad/SEO") — no hace falta
inventar nits para llenar la respuesta.

## Dónde mirar primero (cómo está organizado este proyecto)

- **Título de página**: Next.js App Router. El default vive en `src/app/layout.tsx`
  (`title: { default, template: "%s | EduTech" }`). Cada página puede:
  - exportar `export const metadata = { title: "..." }` (estático, ej. `src/app/cursos/page.tsx`,
    `src/app/quienes-somos/page.tsx`), o
  - exportar `generateMetadata()` async cuando el título depende de datos (curso, instructor, lección).
  - **Chequeo clave**: toda página bajo rutas dinámicas (`[id]`, `[lessonId]`) que muestra una entidad
    con nombre propio (curso, instructor, lección) debe tener su `<title>` específico vía
    `generateMetadata`, no heredar el default genérico. A fecha de esta skill, páginas como
    `src/app/cursos/[id]/page.tsx`, `src/app/instructores/[id]/page.tsx`,
    `src/app/aprender/[id]/page.tsx` y `src/app/aprender/[id]/[lessonId]/page.tsx` NO tienen
    `generateMetadata` — si tocas una de estas, es BLOCKING si sigue así (SEO técnico: cada URL
    indexable necesita un título que la distinga).
  - No hay `<Head>` de pages-router ni `next/head` en este proyecto — no lo sugieras.

- **Heading principal**: cada `page.tsx` debe tener exactamente un `<h1>` dentro de su `<main id="contenido" tabIndex={-1}>`.
  El `<main id="contenido">` + el skip link (`<a href="#contenido" className="eb-skip">` en
  `layout.tsx`) son el patrón de "saltar al contenido" del proyecto — toda página nueva debe envolver
  su contenido en ese mismo `<main id="contenido" tabIndex={-1}>`, o el skip link apunta a nada.

- **Jerarquía de headings**: `h1` → `h2` → `h3` sin saltos, y sin "h2 solo por tamaño de letra" (si es
  visual, usar clases Tailwind sobre un `<p>`/`<span>`, no un heading). Revisa que `aria-labelledby`
  de `<section>` apunte a un `id` real existente (patrón usado en `cursos/[id]/page.tsx` con
  `aria-labelledby="temario"` / `aria-labelledby="resenas"`).

- **Imágenes**: el proyecto hoy no usa `next/image` ni `<img>` en los componentes de curso (todo es
  texto/badges). Si una página o componente nuevo introduce una imagen (foto de instructor, thumbnail
  de curso), exige `next/image` con `alt` descriptivo no vacío (o `alt=""` solo si es puramente
  decorativa y hay texto equivalente al lado) y `width`/`height` o `fill` explícitos.

- **Links vs botones**: navegación = `<Link>` (`next/link`), acción = `<button>` o `<form action={...}>`
  (patrón `ActionForm` / server actions en `app/actions/*.ts`). Un `<Link>` o `<a>` que solo dispara JS
  sin `href` navegable es BLOCKING (inaccesible por teclado/lector como enlace).

- **Formularios e inputs**: cada `<input>`/`<textarea>`/`<select>` necesita label asociado — ya sea
  `<label htmlFor>` o `aria-label` (patrón usado en `cursos/page.tsx`: `aria-label="Buscar cursos"`).
  Revisar `components/course-fields.tsx`, `components/review-fields.tsx`, `components/auth-forms.tsx`
  como referencia de estilo existente. Mensajes de error/éxito de `ActionForm`/`Alert` deben quedar en
  una región con `role="alert"` o `aria-live` (ver `Alert` en `components/ui.tsx`) — si se añade un
  estado de error nuevo sin eso, es IMPORTANT.

- **Estados dinámicos / contenido que cambia sin navegación**: contadores de resultados, filtros
  aplicados, etc. deben llevar `role="status"`/`aria-live="polite"` como ya hace
  `cursos/page.tsx` (`{courses.length} cursos`). Si se agrega un contador o resultado de búsqueda
  similar sin esto, IMPORTANT.

- **Foco y teclado**: cualquier elemento interactivo nuevo (ítem de lista clicable, tarjeta, dropdown)
  debe ser alcanzable con Tab y usar el patrón de foco del proyecto: `box-shadow: var(--ring)` +
  `outline: 2px solid transparent` definido en `app/globals.css` vía las clases `.eb-*`. No introducir
  `outline: none` sin reemplazo, ni `tabindex` positivo. Verifica que targets táctiles nuevos respeten
  el aumento a 44px bajo `@media (pointer: coarse)` si es un botón/ícono pequeño.

- **Idioma y copy**: `lang="es"` ya está en `<html>` (layout.tsx) — no lo dupliques ni lo cambies.
  Recuerda la convención del proyecto: copy de cara al usuario sin tildes (ver nota de "Gotcha" en
  CLAUDE.md) — no es un issue de accesibilidad, no lo reportes como tal, pero si corriges texto no le
  agregues tildes rompiendo los e2e specs que matchean el string exacto.

- **data vs decorativo**: iconos puramente decorativos (★, ×, flechas) deben llevar `aria-hidden="true"`
  con un `sr-only` equivalente si hace falta (patrón ya usado en `Rating` de `course-card.tsx` y en los
  chips de `cursos/page.tsx`). Si agregas un ícono nuevo sin este patrón, IMPORTANT.

- **Metadescripción / Open Graph**: no hay `openGraph` configurado en ninguna página hoy; no lo exijas
  como BLOCKING por defecto (no es el estándar actual del proyecto), pero si una página nueva es de
  cara pública y compartible (ej. detalle de curso), puedes sugerir como NIT añadir `description` propia
  en su `metadata`/`generateMetadata` en vez de heredar la genérica del layout.

## Flujo de trabajo

1. Identifica qué archivos de `src/app/**/page.tsx`, `src/app/layout.tsx` o `src/components/**/*.tsx`
   se crearon o modificaron en esta sesión.
2. Para cada uno, repasa los puntos de arriba que apliquen (no todos aplican a todo archivo — un
   componente puramente de presentación no necesita chequeo de `metadata`, por ejemplo).
3. Reporta los hallazgos con el formato de severidad.
4. Si hay algún BLOCKING, corrígelo ahora mismo (Edit directo) y vuelve a listar el hallazgo marcándolo
   como corregido. No cierres la tarea con un BLOCKING pendiente.
5. Si no tocaste ningún archivo de página/componente en esta sesión, no actives esta revisión.
