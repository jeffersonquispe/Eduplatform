## Context

La app es Next.js 16 con Tailwind 4, que no usa `tailwind.config.ts`: el tema vive en CSS. El diseño de referencia está en `Design System.md` y en el proyecto de Claude Design "El taller del agente". Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**
- Una sola fuente de verdad visual (tokens CSS) consumible desde CSS y desde utilidades de Tailwind.
- Accesibilidad de teclado, táctil y lectores de pantalla verificable en revisión de código.

**Non-Goals:**
- Tema claro o conmutador de tema.
- Refactor de todo el CSS a tokens de espaciado (los `--space-*` existen pero la mayoría de clases usa píxeles literales).
- Cambios de esquema, RLS o lógica de negocio.

## Decisions

- **Tokens en `:root` + `@theme inline` solo para los semánticos.** Evita duplicar la paleta completa en Tailwind y mantiene las utilidades cortas (`text-fg-2`). Alternativa: `tailwind.config.ts` (no aplica en Tailwind 4).
- **Componentes como clases `.eb-*` en `@layer components`** envueltas por `ui.tsx`. Las utilidades de Tailwind las pueden ajustar sin `!important`. Alternativa: componentes React con clases de utilidad (más verboso, estilos dispersos).
- **Foco = `box-shadow: var(--ring)` + `outline: 2px solid transparent`.** El `box-shadow` da el anillo visual; el contorno transparente se vuelve visible en colores forzados.
- **`--ring` en teal-500 sólido** (aprox. 4:1 sobre la tarjeta) en lugar de teal al 45 % (aprox. 1,9:1).
- **Animación como componente de cliente con reloj propio** (`requestAnimationFrame`), portada de `workshop.jsx`, sin depender del motor de composición de Claude Design. Datos embebidos (sin fetch de `data.json`). Audio con WebAudio sintetizado y desactivado por defecto.
- **El copy sin tildes se mantiene** porque los tests e2e comparan esos textos; cambiarlo exige tocar specs y tests a la vez.

## Risks / Trade-offs

- [`taller-agente.tsx` usa `ts-nocheck` y `eslint-disable`, con su propia paleta hex] → Aislado en un solo archivo; tiparlo es trabajo posterior.
- [Redibujar un SVG grande a 60 fps puede costar en móviles] → Se pausa fuera de pantalla y con movimiento reducido; si hace falta, bajar la frecuencia.
- [Fuente Geist no garantizada] → Pila de respaldo con fuentes del sistema.
- [`@media (pointer: coarse)` no cubre portátiles táctiles con puntero fino] → Mínimo de 24 px para todos los punteros.
- [Valores arbitrarios restantes en esqueletos (`w-[72px]`, porcentajes)] → Aceptado; solo afectan a formas de carga.
