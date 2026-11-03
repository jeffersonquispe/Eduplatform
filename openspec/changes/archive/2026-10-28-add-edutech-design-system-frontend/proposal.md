## Why

El frontend se construyó primero con estilos sueltos de Tailwind. Se adoptó el EduTech Design System (ver `Design System.md`) para tener una identidad visual coherente, un tema oscuro único y un criterio de accesibilidad explícito. Este cambio registra de forma retroactiva el trabajo ya implementado, para que el diseño y sus restricciones queden en las specs.

## What Changes

- Tokens del sistema (color, espaciado, radios, sombras, anillo de foco) como variables CSS en `globals.css`, con los semánticos expuestos a Tailwind (`text-fg-2`, `border-border`, ...). Solo tema oscuro.
- Biblioteca de clases `.eb-*` (botón, tarjeta, píldora, input, insignia, alerta, chip, barra de progreso, cabecera) y primitivas React en `components/ui.tsx`.
- Rediseño de las páginas públicas, de aprendizaje e instructor sobre el sistema, más estados de carga (`loading.tsx`, esqueletos de tarjeta) y `nav-link`.
- Revisión de accesibilidad de `CourseCard` y del tema: foco visible también en alto contraste, anillo con contraste suficiente, áreas táctiles, estados `:active`/`:disabled`/`aria-invalid`, y valoración legible por lectores de pantalla.
- Nueva sección "El taller del agente" en la página principal: animación isométrica interactiva importada de Claude Design.
- `CLAUDE.md` documenta la capa de estilos.

## Capabilities

### New Capabilities
- `design-system`: tokens, tema oscuro y componentes `.eb-*` que usa toda la interfaz.
- `interface-accessibility`: requisitos de foco, contraste, áreas táctiles, estados y semántica de los componentes interactivos.
- `home-agent-workshop`: animación explicativa en la página principal, con controles y respeto a las preferencias del usuario.

### Modified Capabilities

## Impact

- Código: `src/app/globals.css`, `src/components/{ui,course-card,nav-link,site-header,action-form,auth-forms,course-fields,review-fields,taller-agente}.tsx`, páginas bajo `src/app/**`, `loading.tsx`, `supabase/seed.sql`.
- Sin cambios de esquema, RLS ni dependencias nuevas.
- Los tests e2e comparan textos de la interfaz (sin tildes): cualquier cambio de copy debe actualizarlos.
