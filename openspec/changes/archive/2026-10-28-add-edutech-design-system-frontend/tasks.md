## 1. Tokens y tema

- [x] 1.1 Definir tokens de color, espaciado, radio, sombra y anillo en `globals.css` y exponer los semánticos con `@theme inline`; verificado: `npx eslint` y `tsc` sin errores
- [x] 1.2 Corregir el `--star` duplicado y el comentario de tema; verificado: una sola declaración de `--star` en `globals.css`

## 2. Componentes

- [x] 2.1 Clases `.eb-*` en `@layer components` y primitivas en `components/ui.tsx`; verificado: las páginas importan `Badge`, `Alert` y `buttonClass`
- [x] 2.2 `CourseCard`, `Rating` y esqueletos de carga (`loading.tsx`); verificado: lint y `tsc` sin errores
- [x] 2.3 Rediseño de páginas públicas, de aprendizaje e instructor sobre el sistema; verificado: `git status` muestra las páginas modificadas

## 3. Accesibilidad

- [x] 3.1 Foco visible en colores forzados (`outline` transparente) y `--ring` con contraste de al menos 3:1; verificado por revisión de código
- [x] 3.2 Áreas táctiles (24 px, y 44 px con `pointer: coarse`) para enlaces de tarjeta; verificado por revisión de código
- [x] 3.3 Estados `:active`, `:disabled`, `aria-invalid` y subrayado del botón enlace; verificado por revisión de código
- [x] 3.4 `Rating` anuncia "Valoración:" con texto `sr-only`; verificado en `course-card.tsx`

## 4. Animación en la home

- [x] 4.1 Portar "El taller del agente" a `components/taller-agente.tsx` con reloj, controles, pausa fuera de pantalla y movimiento reducido; verificado: lint y `tsc` sin errores
- [x] 4.2 Insertar la sección en `src/app/page.tsx`; verificado en el código de la página

## 5. Documentación

- [x] 5.1 Documentar la capa de estilos y el copy sin tildes en `CLAUDE.md`; verificado: sección "Styling layer" presente

## 6. Verificación pendiente

- [ ] 6.1 Revisar en el navegador foco, hover, áreas táctiles y la animación (escritorio y móvil) y anotar defectos
- [ ] 6.2 Ejecutar `npx playwright test` y verificar que los e2e siguen pasando tras los cambios de estilo
- [ ] 6.3 Ejecutar `npm run build` y verificar que termina sin errores
