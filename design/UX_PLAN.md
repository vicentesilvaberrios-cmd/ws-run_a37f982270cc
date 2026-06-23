# UX Plan — Flappy Bird Web

> Proyecto 100% cliente. Una sola ruta (`/`). Toda la lógica y persistencia (high score) ocurre en el navegador. La UI "viva" del juego vive **dentro del canvas** (overlays dibujados con Canvas 2D); el chrome alrededor del canvas usa los tokens del design system.

---

## 1. Pantalla única de juego

- **Ruta**: `app/page.tsx` → monta `<FlappyBirdGame />` a pantalla completa.
- **Objetivo de usuario**: jugar una partida completa (abrir → volar → chocar → ver resultado → reiniciar) y batir su mejor marca personal, persistida en el navegador.

### 1.1 Chrome de página (host, alrededor del canvas)

- **Layout**: contenedor flex (`min-height: 100dvh`, `align-items: center`, `justify-content: center`) con fondo decorativo complementario al cielo del juego (degradado azul claro → azul más oscuro).
- **Componente principal**: `<FlappyBirdGame />` ocupa casi todo el viewport; el canvas se centra y escala manteniendo ratio 400:600.
- **Estilos clave en `app/globals.css`**:
  - `body { background: <degradado>; overflow: hidden; }`
  - `user-select: none` y `touch-action: manipulation` sobre el área de juego (evita scroll, zoom doble-tap y selección de texto).
  - Tipografía retro monoespaciada (`ui-monospace, "Courier New", monospace`) para el `<h1>` y el subtítulo accesibles del DOM.
- **Elementos de DOM (fuera del canvas, para accesibilidad)**:
  - `<h1 class="title">Flappy Bird</h1>` — discreto encima del canvas.
  - `<p class="subtitle">Pulsa Espacio, haz clic o toca para volar</p>` — debajo, cambia dinámicamente según estado (`idle` / `playing` / `gameover`) para que screen readers anuncien contexto.
  - Contenedor con `class="card"` solo si se quiere enmarcar el canvas; en pantallas grandes añadir `box-shadow: var(--shadow)` y `border-radius: var(--radius)`.

### 1.2 Estados in-canvas (overlays dibujados con `render.ts`)

Los overlays se dibujan dentro del canvas usando `ctx.fillText` con tipografía monoespaciada, blanco con sombra/stroke oscuro para garantizar contraste AA sobre el cielo o las tuberías.

| Estado | Elementos visibles (de arriba a abajo) | Notas |
|---|---|---|
| **`idle`** | Título grande `FLAPPY BIRD` · Subtítulo `Pulsa Espacio, haz clic o toca para empezar` · `Mejor marca: N` (solo si N > 0) · Pájaro flotando con bobbing sutil | Sin panel de fondo; texto sobre el cielo. Pájaro con animación idle (no cae por gravedad todavía). |
| **`playing`** | Marcador numérico grande centrado arriba (`{N}`) · Opcional microtexto abajo `Espacio para volar` | Sin overlays. Toda la acción ocurre en el juego. Marcador con sombra para legibilidad sobre cualquier fondo. |
| **`gameover`** | Título `Game Over` · `Puntaje: {N}` · `Mejor marca: {M}` · Badge `¡Nueva marca!` (solo si `isNewBest`) · `Pulsa Espacio, haz clic o toca para volver a jugar` · Pájaro congelado en el lugar del impacto | Panel semitransparente (`rgba(0,0,0,0.55)` con `border-radius`) detrás del texto para legibilidad sobre fondo congelado. |

### 1.3 Comportamiento de input (Épica 8)

- Listener global de `keydown` para `Space` (y `ArrowUp`) en `window` → funciona sin foco en el canvas.
- `mousedown` y `touchstart` sobre el canvas con `preventDefault()` → evita scroll/zoom.
- Mapeo único de input por estado:
  - `idle` → iniciar (→ `playing`).
  - `playing` → flap (impulso hacia arriba).
  - `gameover` → reiniciar (→ `idle` con todo reseteado).
- Mismo verbo "Pulsa Espacio, haz clic o toca…" en los tres estados con acción equivalente (empezar / volar / reiniciar) para consistencia.

---

## 2. Copy de referencia (para devs)

Todas las cadenas en español, sin jerga técnica:

- Idle título (canvas): `FLAPPY BIRD`
- Idle subtítulo (canvas): `Pulsa Espacio, haz clic o toca para empezar`
- Idle high score (canvas): `Mejor marca: {N}`
- Playing marcador (canvas): `{N}` (solo el número, grande y centrado arriba)
- Game Over título (canvas): `Game Over`
- Game Over puntaje (canvas): `Puntaje: {N}`
- Game Over high score (canvas): `Mejor marca: {N}`
- Game Over nueva marca (canvas): `¡Nueva marca!` (badge visible)
- Game Over instrucción (canvas): `Pulsa Espacio, haz clic o toca para volver a jugar`
- Host h1 (DOM): `Flappy Bird`
- Host subtítulo (DOM, cambia por estado):
  - idle → `Pulsa Espacio, haz clic o toca la pantalla para empezar`
  - playing → `Vuela: pulsa Espacio o toca la pantalla`
  - gameover → `Game Over. Pulsa Espacio, haz clic o toca para volver a jugar`

---

## 3. Responsive

- **Canvas**: dimensiones lógicas fijas (400×600) en `GameConfig`; el componente calcula `scale = min(viewportW / 400, viewportH / 600)` y aplica `transform: scale(...)` o ajusta `width/height` para encajar sin deformarse.
- **Móvil portrait**: canvas ocupa casi todo el alto disponible (mínimo 16px de padding lateral); `min-height: 100dvh` evita el rebote por barra de URL.
- **Desktop**: canvas centrado, máximo 400×600, con `box-shadow: var(--shadow)` para destacar sobre el fondo.
- **`touch-action: manipulation`** en el canvas para impedir zoom doble-tap y scroll de página.
- **Sin scroll de página**: `body { overflow: hidden }` en el host.

---

## 4. Accesibilidad

- **Anuncio de estado**: el canvas lleva `role="img"` + `aria-label` dinámico según estado (cambia con React state):
  - idle → `"Flappy Bird. Pulsa Espacio para empezar. Mejor marca: {N}."`
  - playing → `"Flappy Bird. Puntaje {N}."`
  - gameover → `"Game Over. Puntaje {N}. Mejor marca {N}. Pulsa Espacio para reiniciar."`
- **Foco visible**: el subtítulo del DOM fuera del canvas usa los estilos `:focus-visible` globales del design system.
- **Contraste de overlays**: texto blanco con sombra/stroke oscuro; panel semitransparente en `gameover` para legibilidad.
- **Badge "¡Nueva marca!"**: texto + color (no solo color) — cumple regla de no comunicar estado solo por color.
- **Input por teclado sin foco**: listener de `Space` en `window` para que funcione nada más cargar la página.
- **`prefers-reduced-motion`**: respetar en `idle` — sustituir el bobbing del pájaro por posición estática y omitir la animación de aleteo (frame fijo).

---

## 5. Estados de carga / error / vacío

- **Cargando (hidratación del Client Component)**: texto breve `Cargando juego…` sobre fondo del cielo; desaparece al primer frame del canvas.
- **localStorage no disponible** (modo privado / bloqueado): degradar con elegancia; mostrar `Mejor marca` solo en memoria de la sesión actual, sin mostrar error visible.
- **Error de canvas (sin soporte 2D, muy raro)**: `<div class="alert alert-error">No pudimos iniciar el juego. Recarga la página o prueba otro navegador.</div>` en lugar del canvas.

---

## 6. Consistencia y notas para devs

- **Todo copy en español** (regla #1 del design system); ninguna cadena visible usa jerga técnica.
- **Color de marca `--brand`** no aplica dentro del canvas (la paleta retro es propia del juego); el chrome de página sí usa los tokens (`var(--surface)`, `var(--text)`, etc.).
- **Mismo patrón visual para overlays** en `idle` y `gameover`: título grande + instrucción abajo con la misma frase tipo ("Pulsa Espacio, haz clic o toca…").
- **Reutilizar** `ctx.fillText` con la misma fuente/tamaño para marcadores en `playing` y `gameover`; mismo tamaño de fuente en todos los overlays (jerarquía solo por `font-size`).
- **`useFlappyGame.ts`** expone exactamente `{ state, score, highScore, isNewBest, flap, reset }` para que el componente solo decida qué overlay dibujar y qué `aria-label` anunciar — sin lógica de juego mezclada con UI.