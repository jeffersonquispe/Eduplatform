# EduTech Design System — Referencia para otros proyectos

Plataforma de cursos digitales de IA y marketing digital, educación adulta B2B. Tono serio, interfaz plana, español con tuteo.

## Uso rápido
1. Copia `tokens/` y `styles.css` (solo `@import`) al proyecto y enlaza `styles.css`.
2. Componentes React en `components/core/` (Button, Field, Badge, Rating, Alert, CourseCard, SiteHeader), con clases `.eb-*` de `tokens/components.css`.
3. Fuente: Geist y Geist Mono (Google Fonts).

## Principios
- Fondo blanco, superficies slate-50; marino `#0F2A4A` para acciones y marca, verde azulado `#0E7C86` como acento.
- Tarjetas planas con borde 1px; sombra solo en hover. Sin gradientes, imágenes ni blur.
- Radios: controles 6px, tarjetas 8px, pills/badges 9999px.
- Interfaz 14px; títulos semibold con tracking -0.025em. Espaciado de 4px; contenedor 1024px.
- Hover: primario aclara a navy-700; secundario a slate-100; enlaces subrayan. Foco: anillo de 3px. Transición 150ms. Deshabilitado: opacidad .6.
- Copy: español, tuteo, casing de oración, sin emoji ni exclamaciones. Ej.: "Inscribirme gratis", "Inicia sesión para inscribirte", "No encontramos cursos con esos criterios."
- Iconos: solo Unicode (★ ← →); si hace falta una librería, Lucide (trazo 1.5px). No hay logo: usar el texto "EduTech" en Geist semibold.
- Tema oscuro (kit de plataforma): fondo #0A1B33, tarjetas #0F2A4A, acción #0E7C86, texto #F1F5F9.

## Tokens: colores
```css
:root{
--navy-950:#0A1B33;--navy-900:#0F2A4A;--navy-800:#163A63;--navy-700:#1D4E89;--navy-600:#2A62A6;--navy-100:#DCE7F4;--navy-50:#EEF3FA;
--teal-700:#0B6B73;--teal-600:#0E7C86;--teal-500:#14939F;--teal-100:#D5EEF0;--teal-50:#EBF7F8;
--slate-950:#0F172A;--slate-900:#1E293B;--slate-700:#334155;--slate-600:#475569;--slate-500:#64748B;--slate-400:#94A3B8;--slate-300:#CBD5E1;--slate-200:#E2E8F0;--slate-100:#F1F5F9;--slate-50:#F8FAFC;--white:#FFFFFF;
--green-700:#166534;--green-100:#DCFCE7;--amber-700:#92400E;--amber-100:#FEF3C7;--red-700:#B91C1C;--red-100:#FEE2E2;--star:#B7791F;
--bg:var(--white);--bg-subtle:var(--slate-50);--surface-card:var(--white);--surface-header:var(--white);--surface-inverse:var(--navy-900);
--fg-1:var(--slate-950);--fg-2:var(--slate-700);--fg-3:var(--slate-500);--fg-inverse:var(--white);
--border:var(--slate-200);--border-strong:var(--slate-300);--border-focus:var(--navy-700);
--action:var(--navy-900);--action-hover:var(--navy-700);--action-fg:var(--white);--accent:var(--teal-600);--link:var(--navy-700);
--success-bg:var(--green-100);--success-fg:var(--green-700);--warning-bg:var(--amber-100);--warning-fg:var(--amber-700);--danger-bg:var(--red-100);--danger-fg:var(--red-700);--info-bg:var(--navy-50);--info-fg:var(--navy-800);
}
```

## Tema oscuro de la plataforma (por defecto en la app)
La app Next.js usa este tema: reasigna solo los tokens semánticos; la paleta base no cambia. Los componentes `.eb-*` no llevan colores fijos, así que funcionan igual en ambos temas.
```css
:root{
color-scheme:dark;
--bg:var(--navy-950);--bg-subtle:#123056;--surface-card:var(--navy-900);--surface-header:var(--navy-950);
--surface-control:#0C2140;--surface-hover:var(--navy-800);--surface-skeleton:#1D3A5F;
--fg-1:#F1F5F9;--fg-2:var(--slate-300);--fg-3:var(--slate-400);
--border:#1E3A5F;--border-strong:#4A76AD;--border-focus:var(--teal-500);
--action:var(--teal-600);--action-hover:var(--teal-700);--action-fg:var(--white);--accent:var(--teal-500);--link:#7DB4F0;
--success-bg:#0F3D2E;--success-fg:#86EFAC;--warning-bg:#3D2F0A;--warning-fg:#FCD34D;--danger-bg:#4A1620;--danger-fg:#FCA5A5;--danger-border:#8B2A3A;
--info-bg:var(--navy-800);--info-fg:var(--navy-100);--star:#F2B84B;
--ring:0 0 0 3px rgba(20,147,159,.45);--shadow-md:0 4px 16px rgba(0,0,0,.35);
}
```
- Superficies: página `--bg` (#0A1B33) → tarjetas `--surface-card` (#0F2A4A) → controles `--surface-control` (#0C2140, un paso más oscuro que la tarjeta para que el campo "se hunda").
- Hover del primario: en oscuro **oscurece** a `--teal-700` (no aclara): aclarar a teal-500 deja el texto blanco en 3,7:1.
- Contrastes medidos (WCAG): fg-1/bg 15,7:1 · fg-2/bg 11,6:1 · fg-3/card 5,7:1 · enlace/card 6,7:1 · texto blanco sobre acción 4,95:1 (hover 6,2:1) · badges de estado 7,7–9,1:1 · borde de controles 3,4:1 (mín. 3:1 para elementos no textuales).
- Nuevas clases: `.eb-chip` (filtro activo con ×), `.eb-progress` (barra de 6px), `.eb-skip` (enlace "Saltar al contenido", visible solo con foco), `.eb-surface` (contenedor con borde).
- Táctil: con `pointer:coarse`, botones, pills y chips miden mín. 44px de alto.

## Tokens: tipografía
```css
:root{
--font-sans:'Geist',system-ui,-apple-system,'Segoe UI',sans-serif;--font-mono:'Geist Mono',ui-monospace,Menlo,monospace;
--text-xs:12px;--text-sm:14px;--text-base:16px;--text-lg:18px;--text-2xl:24px;--text-3xl:30px;--text-4xl:36px;
--lh-tight:1.2;--lh-snug:1.375;--lh-normal:1.5;--tracking-tight:-0.025em;--tracking-wide:0.025em;
--fw-regular:400;--fw-medium:500;--fw-semibold:600;
}
body{font-family:var(--font-sans);font-size:var(--text-base);line-height:var(--lh-normal);color:var(--fg-1);background:var(--bg);-webkit-font-smoothing:antialiased}
a{color:var(--link);text-decoration:none}a:hover{text-decoration:underline}
```

## Tokens: espaciado, radios, sombras, movimiento
```css
:root{
--space-1:4px;--space-2:8px;--space-3:12px;--space-4:16px;--space-5:20px;--space-6:24px;--space-8:32px;--space-10:40px;--space-12:48px;
--radius-md:6px;--radius-lg:8px;--radius-full:9999px;
--shadow-sm:0 1px 2px rgba(15,23,42,.06);--shadow-md:0 4px 12px rgba(15,23,42,.08);--ring:0 0 0 3px rgba(29,78,137,.25);
--container:1024px;--ease:cubic-bezier(.4,0,.2,1);--dur:150ms;
}
```

## Clases de componentes (`.eb-*`)
```css
.eb-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font:500 14px/20px var(--font-sans);padding:8px 16px;border-radius:var(--radius-md);border:1px solid transparent;cursor:pointer;transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease);text-decoration:none}
.eb-btn:hover{text-decoration:none}.eb-btn:focus-visible{outline:none;box-shadow:var(--ring)}.eb-btn:disabled{opacity:.6;cursor:not-allowed}
.eb-btn--sm{padding:6px 12px}.eb-btn--block{width:100%}
.eb-btn--primary{background:var(--action);color:var(--action-fg)}.eb-btn--primary:hover:not(:disabled){background:var(--action-hover)}
.eb-btn--secondary{background:var(--white);color:var(--fg-1);border-color:var(--border-strong)}.eb-btn--secondary:hover:not(:disabled){background:var(--slate-100)}
.eb-btn--danger{background:var(--white);color:var(--danger-fg);border-color:#FCA5A5}.eb-btn--danger:hover:not(:disabled){background:var(--danger-bg)}
.eb-btn--link{background:none;color:var(--link);padding:0;text-decoration:underline}
.eb-label{display:block;font:400 14px/20px var(--font-sans);color:var(--fg-1)}.eb-label>span{display:block;margin-bottom:4px}
.eb-input{width:100%;box-sizing:border-box;font:400 14px/20px var(--font-sans);padding:8px 12px;border:1px solid var(--border-strong);border-radius:var(--radius-md);background:var(--white);color:var(--fg-1)}
.eb-input:focus{outline:none;border-color:var(--border-focus);box-shadow:var(--ring)}.eb-input::placeholder{color:var(--fg-3)}
.eb-badge{display:inline-flex;align-items:center;font:400 12px/16px var(--font-sans);padding:2px 8px;border-radius:var(--radius-full);background:var(--slate-100);color:var(--fg-2)}
.eb-badge--success{background:var(--success-bg);color:var(--success-fg)}.eb-badge--warning{background:var(--warning-bg);color:var(--warning-fg)}.eb-badge--info{background:var(--info-bg);color:var(--info-fg)}
.eb-pill{font:400 14px/20px var(--font-sans);padding:4px 12px;border-radius:var(--radius-full);border:1px solid var(--border-strong);background:var(--white);color:var(--fg-1);cursor:pointer;transition:background var(--dur)}
.eb-pill:hover{background:var(--slate-100)}.eb-pill--active,.eb-pill--active:hover{background:var(--action);border-color:var(--action);color:var(--white)}
.eb-alert{font:400 14px/20px var(--font-sans);padding:8px 12px;border-radius:var(--radius-md)}
.eb-alert--error{background:var(--danger-bg);color:var(--danger-fg)}.eb-alert--success{background:var(--success-bg);color:var(--success-fg)}.eb-alert--info{background:var(--info-bg);color:var(--info-fg)}
.eb-card{display:flex;flex-direction:column;border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px;background:var(--surface-card);list-style:none;transition:box-shadow var(--dur),border-color var(--dur)}
.eb-card:hover{border-color:var(--border-strong);box-shadow:var(--shadow-md)}
.eb-card:focus-within{border-color:var(--border-focus)}
.eb-card--loading,.eb-card--loading:hover{pointer-events:none;border-color:var(--border);box-shadow:none}
.eb-skel{display:block;background:var(--slate-100);border-radius:var(--radius-md);animation:eb-pulse 1.5s var(--ease) infinite}
@keyframes eb-pulse{50%{opacity:.5}}@media (prefers-reduced-motion:reduce){.eb-skel{animation:none}}
.eb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--space-4);margin:0;padding:0;list-style:none}
.eb-header{border-bottom:1px solid var(--border);background:var(--surface-header)}.eb-header nav{max-width:var(--container);margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 16px;font:400 14px/20px var(--font-sans)}
.eb-header a{color:var(--fg-2)}.eb-header a:hover{color:var(--fg-1)}.eb-header .eb-brand{font-weight:600;color:var(--navy-900)}
```

## Componentes React

### Button
Botón de acción; usa primary para la acción principal de una vista.

```jsx
<Button>Inscribirme gratis</Button>
<Button variant="secondary" size="sm">Guardar reseña</Button>
```
Variantes: primary, secondary, danger, link. Props: size sm, block, disabled.
**Props:**
```ts
import * as React from 'react';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>{variant?:'primary'|'secondary'|'danger'|'link';size?:'md'|'sm';block?:boolean}
export function Button(props:ButtonProps):JSX.Element;
```
**Implementación:**
```jsx
import React from 'react';
export function Button({variant='primary',size='md',block=false,className='',children,...rest}){
return <button className={['eb-btn','eb-btn--'+variant,size==='sm'&&'eb-btn--sm',block&&'eb-btn--block',className].filter(Boolean).join(' ')} {...rest}>{children}</button>;}
```

### Field
Campo de formulario con etiqueta (input, textarea o select).

```jsx
<Field label="Correo" type="email" />
<Field label="Categoría" as="select"><option>Marketing</option></Field>
```
**Props:**
```ts
import * as React from 'react';
export interface FieldProps{label:string;as?:'input'|'textarea'|'select';className?:string;children?:React.ReactNode;[k:string]:any}
export function Field(props:FieldProps):JSX.Element;
```
**Implementación:**
```jsx
import React from 'react';
export function Field({label,as='input',children,className='',...rest}){
const C=as;return <label className="eb-label"><span>{label}</span><C className={'eb-input '+className} {...rest}>{children}</C></label>;}
```

### Badge
Etiqueta redondeada para categoría o estado (Publicado, Borrador).

```jsx
<Badge tone="success">Publicado</Badge>
```
**Props:**
```ts
import * as React from 'react';
export interface BadgeProps{tone?:'neutral'|'success'|'warning'|'info';children?:React.ReactNode}
export function Badge(props:BadgeProps):JSX.Element;
```
**Implementación:**
```jsx
import React from 'react';
export function Badge({tone='neutral',children}){return <span className={'eb-badge'+(tone==='neutral'?'':' eb-badge--'+tone)}>{children}</span>;}
```

### Rating
Valoración promedio con estrella y conteo de reseñas.

```jsx
<Rating avg={4.6} count={28} />
```
**Props:**
```ts
export interface RatingProps{avg?:number;count?:number}
export function Rating(props:RatingProps):JSX.Element;
```
**Implementación:**
```jsx
import React from 'react';
export function Rating({avg=0,count=0}){
if(!count)return <span style={{fontSize:12,color:'var(--fg-3)'}}>Aún sin valoraciones</span>;
return <span style={{fontSize:12,color:'var(--fg-2)'}}><span aria-hidden style={{color:'var(--star)'}}>★</span> {Number(avg).toFixed(1).replace('.',',')} <span style={{color:'var(--fg-3)'}}>({count} {count===1?'reseña':'reseñas'})</span></span>;}
```

### Alert
Mensaje de retroalimentación en formularios.

```jsx
<Alert tone="error">Credenciales incorrectas.</Alert>
```
**Props:**
```ts
import * as React from 'react';
export interface AlertProps{tone?:'error'|'success'|'info';children?:React.ReactNode}
export function Alert(props:AlertProps):JSX.Element;
```
**Implementación:**
```jsx
import React from 'react';
export function Alert({tone='error',children}){return <p role={tone==='error'?'alert':'status'} className={'eb-alert eb-alert--'+tone} style={{margin:0}}>{children}</p>;}
```

### CourseCard
Tarjeta de curso. Siempre es un `<li>` con la clase `.eb-card`; colócala dentro de un `<ul class="eb-grid">`. Compone Badge, Rating y (en la variante instructor) Button. Sin imagen ni gradiente: la jerarquía la dan el título y el borde.

```jsx
<CourseCard title="SEO avanzado" description="…" category="Marketing" instructor="Ana R." avg={4.5} count={12} />
<CourseCard variant="instructor" status="draft" title="SEO avanzado" description="…" category="Marketing" actions={<Button size="sm" variant="secondary">Editar</Button>} />
<CourseCard loading />
```

#### Anatomía
De arriba abajo: fila de badges (categoría y, en instructor, estado) → título (h3, enlace) → descripción (máx. 3 líneas) → pie anclado al fondo con `margin-top:auto` (autor + Rating en catálogo; Rating + acciones en instructor). Así todas las tarjetas de una fila alinean el pie aunque las descripciones difieran.

#### Tokens
| Aspecto | Propiedad | Token |
|---|---|---|
| Color | Fondo | `--surface-card` |
| | Borde (normal / hover / foco interno) | `--border` / `--border-strong` / `--border-focus` |
| | Título | `--fg-1` |
| | Descripción, autor | `--fg-2` |
| | "Aún sin valoraciones", conteo de reseñas | `--fg-3` |
| | Estrella del Rating | `--star` |
| | Badge de categoría | `--slate-100` fondo, `--fg-2` texto |
| | Badge de estado (instructor) | `--success-bg/--success-fg` Publicado; `--warning-bg/--warning-fg` Borrador |
| | Skeleton (loading) | `--slate-100` |
| Espaciado | Padding interno | `--space-4` (16px) |
| | Badges → título | `--space-2` (8px) |
| | Título → descripción | `--space-1` (4px) |
| | Descripción → pie | `--space-3` (12px) mínimo |
| | Separación entre tarjetas (`.eb-grid`) | `--space-4` (16px) |
| | Separación entre acciones | `--space-2` (8px) |
| Radio | Tarjeta | `--radius-lg` (8px) |
| | Badges, skeleton de badge | `--radius-full` |
| | Bloques skeleton | `--radius-md` (6px) |
| Sombra | Solo hover | `--shadow-md` (nunca en reposo) |
| Tipografía | Título | 600 16px/24px (`--text-base`, `--fw-semibold`) |
| | Descripción | 400 14px/20px (`--text-sm`) |
| | Autor, Rating | 12px (`--text-xs`) |
| Movimiento | Borde y sombra | `--dur` (150ms) |
| | Pulso del skeleton | 1.5s `--ease`, solo opacidad |

#### Estados
| Estado | Aspecto | Notas |
|---|---|---|
| Normal | Borde `--border`, sin sombra | Reposo. |
| Hover | Borde `--border-strong` + `--shadow-md` | Transición 150ms. El título no cambia de color ni se subraya; el feedback es de la tarjeta entera. |
| Foco | Anillo `--ring` en el enlace del título; borde `--border-focus` en la tarjeta (`:focus-within`) | El enlace del título es el único destino de teclado de la tarjeta; en instructor, los botones de acción tienen su propio foco. |
| Loading | Mismos bloques que la tarjeta real, en `--slate-100`, con pulso de opacidad (1 → .5) | Usa `loading` o `.eb-card--loading`. Sin hover ni clics (`pointer-events:none`), `aria-hidden` en la tarjeta. Mismas medidas que la tarjeta cargada para evitar saltos de layout. Con `prefers-reduced-motion` el pulso se desactiva. Sin shimmer ni gradiente. |
| Vacío (sin reseñas) | Rating muestra "Aún sin valoraciones" | No es un estado de la tarjeta, sino del Rating. |

Mientras el contenedor carga, renderiza 6 tarjetas `loading` dentro del mismo `.eb-grid` y marca el `<ul>` con `aria-busy="true"`.

#### Patrones donde aparece
**1. Galería del catálogo (`variant="catalog"`, por defecto)**
- `<ul class="eb-grid">`: columnas `repeat(auto-fill, minmax(280px, 1fr))`, gap 16px, dentro del contenedor de 1024px (3 columnas en escritorio, 2 en tablet, 1 en móvil).
- Muestra categoría, título, descripción, autor y Rating. Toda la información es de lectura; la única acción es abrir el detalle (`onOpen`).
- Estados de la galería: cargando (6 tarjetas `loading`), con resultados, vacío ("No encontramos cursos con esos criterios." en lugar del grid).
- También se usa en "Mis cursos" del estudiante con esta misma variante.

**2. Panel del instructor (`variant="instructor"`)**
- Mismo `.eb-grid`, pero el título abre el editor del curso.
- La fila superior añade un Badge de estado: `Publicado` (success) o `Borrador` (warning). Un borrador no muestra el Rating (no tiene reseñas) sino "Aún sin valoraciones".
- El pie sustituye al autor (siempre es el propio instructor) por `actions`: máximo 2 botones `size="sm"`, secundario para "Editar" y primario solo para la acción principal ("Publicar"). Las acciones destructivas (Eliminar) no van en la tarjeta; viven en el editor.
- Foco y hover idénticos al catálogo; los clics en los botones no disparan `onOpen`.

#### Reglas
- Una sola acción primaria por tarjeta, y solo en la variante instructor.
- No añadas imagen, precio ni sombra en reposo; si hace falta, extiende el pie, no el encabezado.
- Copy en español con tuteo y casing de oración; sin emoji ni exclamaciones.

**Props:**
```ts
import * as React from 'react';
export interface CourseCardProps{title?:string;description?:string;category?:string;instructor?:string;avg?:number;count?:number;onOpen?:()=>void;variant?:'catalog'|'instructor';status?:'draft'|'published';actions?:React.ReactNode;loading?:boolean}
export function CourseCard(props:CourseCardProps):JSX.Element;
```
`title` y `description` son obligatorios salvo con `loading`.

**Implementación:**
```jsx
import React from 'react';
import {Badge} from './Badge.jsx';import {Rating} from './Rating.jsx';
const sk=(w,h,extra)=><span className="eb-skel" style={{width:w,height:h,...extra}}/>;
export function CourseCard({title,description,category,instructor,avg,count,onOpen,variant='catalog',status,actions,loading=false}){
if(loading)return <li className="eb-card eb-card--loading" aria-hidden="true">
{sk(72,20,{borderRadius:'var(--radius-full)',marginBottom:8})}{sk('70%',24)}{sk('100%',14,{marginTop:8})}{sk('85%',14,{marginTop:6})}{sk('60%',14,{marginTop:6})}
<div style={{marginTop:'auto',paddingTop:12,display:'flex',justifyContent:'space-between'}}>{sk(80,12)}{sk(64,12)}</div></li>;
const isInstructor=variant==='instructor';
return <li className="eb-card"><div style={{marginBottom:8,display:'flex',gap:8,flexWrap:'wrap'}}>{category&&<Badge>{category}</Badge>}{isInstructor&&status&&<Badge tone={status==='published'?'success':'warning'}>{status==='published'?'Publicado':'Borrador'}</Badge>}</div>
<h3 style={{margin:0,font:'600 16px/24px var(--font-sans)'}}><a href="#" onClick={e=>{e.preventDefault();onOpen&&onOpen();}} style={{color:'var(--fg-1)'}}>{title}</a></h3>
<p style={{margin:'4px 0 0',fontSize:14,lineHeight:'20px',color:'var(--fg-2)',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{description}</p>
<div style={{marginTop:'auto',paddingTop:12,display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
{isInstructor?<><Rating avg={avg} count={count}/><div style={{display:'flex',gap:8}}>{actions}</div></>:<><span style={{fontSize:12,color:'var(--fg-2)'}}>{instructor}</span><Rating avg={avg} count={count}/></>}</div></li>;}
```

### SiteHeader
Cabecera con marca, enlace a Cursos y acciones de sesión.

```jsx
<SiteHeader user={{name:'Lucía',role:'student'}} onNav={console.log} />
```
**Props:**
```ts
export interface SiteHeaderProps{brand?:string;user?:{name:string;role:'student'|'instructor'}|null;onNav?:(page:string)=>void}
export function SiteHeader(props:SiteHeaderProps):JSX.Element;
```
**Implementación:**
```jsx
import React from 'react';
export function SiteHeader({brand='EduTech',user,onNav}){
const go=(p)=>(e)=>{e.preventDefault();onNav&&onNav(p);};
return <header className="eb-header"><nav><div style={{display:'flex',gap:20,alignItems:'center'}}><a href="#" className="eb-brand" onClick={go('home')}>{brand}</a><a href="#" onClick={go('catalog')}>Cursos</a></div>
<div style={{display:'flex',gap:16,alignItems:'center'}}>{user?<><a href="#" onClick={go(user.role==='instructor'?'instructor':'mine')}>{user.role==='instructor'?'Panel':'Mis cursos'}</a><span style={{color:'var(--fg-3)'}}>{user.name}</span><a href="#" style={{textDecoration:'underline'}} onClick={go('logout')}>Salir</a></>:<><a href="#" style={{textDecoration:'underline'}} onClick={go('login')}>Iniciar sesión</a><a href="#" className="eb-btn eb-btn--primary eb-btn--sm" style={{color:'#fff'}} onClick={go('register')}>Crear cuenta</a></>}</div></nav></header>;}
```

## Patrones de UX de la plataforma
- **Estado vacío:** mensaje breve + una acción primaria (`Explorar el catálogo`, `Crear mi primer curso`, `Quitar filtros`).
- **Carga:** `loading.tsx` con `CourseGridSkeleton` (6 tarjetas `loading`) y `aria-busy`.
- **Filtros activos:** `.eb-chip` con "×" y texto oculto "Quitar…"; el contador de resultados va en `aria-live="polite"`.
- **Navegación:** el enlace de la cabecera de la sección actual lleva `aria-current="page"` (texto `--fg-1` y subrayado).
- **Detalle de curso:** columna lateral fija en escritorio (`lg`) con la acción de inscripción y el resumen (secciones, lecciones, precio).
- **Aprendizaje:** "Lección X de N" + `.eb-progress` (progreso por posición) y botones Anterior (secundario) / Siguiente (primario).
- **Panel del instructor:** fila de métricas en `.eb-surface` (cursos, inscritos, valoración media) y pills de estado Todos/Publicados/Borradores con conteo.
- **Editor:** lista de requisitos de publicación (✓ / ○, con texto para lector de pantalla). Solo orienta: el botón sigue activo y la barrera real es el trigger de la base de datos.

## Pantallas de referencia
`ui_kits/plataforma/`: inicio, catálogo con filtros, detalle de curso, login/registro, Mis cursos, panel del instructor.

## Fuente
https://github.com/jeffersonquispe/Eduplatform (la paleta azul/verde azulado es una propuesta; el repo solo usa neutros zinc).
