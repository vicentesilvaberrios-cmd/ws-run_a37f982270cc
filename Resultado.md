# Resultado.md — Flappy Bird Web Game

## Resumen del proyecto

Juego web tipo Flappy Bird construido **100% en el cliente** con Next.js 14 (App Router) + TypeScript. El juego se renderiza sobre un `<canvas>` HTML5, incluye físicas de gravedad e impulso, tuberías procedurales, colisiones, puntuación, persistencia de high score en `localStorage` y estilo visual retro colorido. No hay backend, API, ni base de datos.

---

## Stack confirmado

| Aspecto | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript |
| Rendering | HTML5 Canvas 2D (`getContext('2d')`) |
| Game loop | `requestAnimationFrame` con delta-time normalizado |
| Estado | React state + refs para mutables del loop |
| Persistencia | `localStorage` (clave `flappy-highscore`) |
| Backend | **No requerido** — sin endpoints API, sin BD |

---

## Archivos generados (reales)

```
.
├── app/
│   ├── globals.css                          — Design system base + estilos del host
│   ├── layout.tsx                           — Layout raíz, metadatos, viewport anti-zoom
│   ├── page.tsx                             — Página única; monta <FlappyBirdGame/>
│   └── components/
│       ├── FlappyBirdGame.tsx               — Componente cliente: canvas, escalado, input, render loop
│       └── game/
│           ├── constants.ts                 — GameConfig + clave de localStorage
│           ├── types.ts                     — Interfaces Bird, Pipe, GameState
│           └── useFlappyGame.ts             — Hook con toda la lógica del game loop
├── design/
│   ├── UX_PLAN.md                           — Plan de UX del juego
│   └── UX_GUIDELINES.md                     — Guías de UX de la fábrica
├── package.json                             — Dependencias (next 14, react 18, typescript 5)
├── tsconfig.json
├── next.config.mjs
├── next-env.d.ts
├── spec.md                                  — Especificación del proyecto
├── plan.json                                — Plan de ejecución (frontend/backend/criterios)
├── .gitignore
└── .codegraph.db
```

> **Nota estructural**: el plan mencionaba `components/` en la raíz y un `render.ts` separado. En la implementación real, los componentes viven bajo `app/components/` y toda la lógica de renderizado del canvas está integrada en `FlappyBirdGame.tsx` (no se creó un `render.ts` independiente). No existen directorios `app/api/`, `migrations/`, ni `lib/` — coherente con la naturaleza 100% cliente del proyecto.

---

## Lo que se construyó por épica/módulo

### Épica 1 — Motor del juego (Canvas + game loop)
- Canvas con dimensiones lógicas fijas 400×600 y escalado responsivo al viewport manteniendo aspect ratio.
- Game loop con `requestAnimationFrame` y delta-time normalizado (`dt` calculado contra 60 FPS referencia).
- Tres estados gestionados: `idle`, `playing`, `gameover`.
- En `idle`: pájaro flotando con animación de bobbing sinusoidal y mensaje de inicio.
- Transiciones `idle→playing` (al input), `playing→gameover` (al colisionar), `gameover→idle` (al input de reinicio).

### Épica 2 — Pájaro y físicas
- Entidad `Bird` con posición, velocidad vertical, radio de colisión, rotación y frame de animación.
- Gravedad constante aplicada cada frame (`gravity = 0.5`).
- Impulso (flap) instantáneo (`flapStrength = -8`).
- Tope de velocidad de caída (`maxFallSpeed = 10`).
- Rotación visual según velocidad (inclinación hacia arriba al subir, hacia abajo al caer).
- Animación de aleteo de 3 frames; acelerada durante el ascenso.
- Posición X fija (`birdX = 100`, ~25% del ancho).

### Épica 3 — Tuberías
- Entidad `Pipe` con id, x, width, gapY, gapHeight, scored.
- Spawn a intervalos regulares basados en `pipeSpacing` (220px de desplazamiento acumulado).
- `gapY` aleatorio dentro de rango seguro (80 a `canvasHeight - floorHeight - 80`).
- Movimiento hacia la izquierda a `pipeSpeed = 2.5` px/frame.
- Eliminación de tuberías que salen del canvas por la izquierda (`x + width < -10`).
- Renderizado con cuerpo verde, biselado claro/oscuro, borde y cap más ancho en el extremo.

### Épica 4 — Puntuación
- Contador iniciado en 0 al empezar.
- Incremento de +1 cuando `pipe.x + pipe.width < bird.x` (pájaro cruza el centro de la tubería).
- Flag `scored` por tubería para evitar doble conteo.
- Marcador grande centrado en la parte superior durante `playing`.

### Épica 5 — Colisiones
- Colisión pájaro-suelo: `bird.y + bird.radius >= floorY` → game over.
- Colisión pájaro-techo: `bird.y - bird.radius <= 0` → game over.
- Colisión pájaro-tubería: algoritmo círculo-rectángulo (circle-rect) para ambas partes (superior e inferior).
- El hueco entre tuberías es libre de colisión (gapHeight = 150).

### Épica 6 — Game Over y reinicio
- Al colisionar, el estado cambia a `gameover` y el pájaro se congela en posición.
- Overlay de Game Over con panel semitransparente: título, puntaje obtenido, mejor puntaje, e instrucción de reinicio.
- Al recibir input en `gameover`: reset completo (pájaro, tuberías, puntaje) y vuelta a `idle`.

### Épica 7 — High Score persistente
- Lectura de `localStorage.getItem('flappy-highscore')` al montar el componente.
- Mostrado en pantalla `idle` y en pantalla de Game Over.
- Actualización y guardado en `localStorage.setItem(...)` al superar el récord.
- Badge "¡Nueva marca!" visible en Game Over cuando se bate el récord.
- Manejo graceful de `localStorage` no disponible (try/catch silencioso).

### Épica 8 — Controles responsivos
- Teclado: listener global `keydown` para `Space` y `ArrowUp` con `preventDefault()`.
- Mouse: `mousedown` sobre el canvas con `preventDefault()`.
- Touch: `touchstart` sobre el canvas con `preventDefault()`.
- `touch-action: manipulation` en body y canvas; `overflow: hidden` en body; viewport con `maximumScale: 1, userScalable: false`.
- Mapeo único de input según estado (iniciar / volar / reiniciar).

### Épica 9 — Estilo visual retro colorido
- Cielo con degradado azul (`#4ec0ca` → `#71c5cf`).
- Nubes decorativas con desplazamiento en parallax.
- Tuberías verdes con biselado (claro/oscuro), borde y cap retro.
- Suelo con textura de bloques desplazable y línea superior verde oscura.
- Pájaro amarillo/naranja con ala blanca animada, ojo, pico naranja y borde oscuro.
- Tipografía monoespaciada (`ui-monospace, "Courier New", monospace`) con stroke/sombra para legibilidad.
- Canvas centrado con `box-shadow` y `border-radius` sobre fondo degradado.

### Accesibilidad (extra)
- Canvas con `role="img"` y `aria-label` dinámico según estado.
- `<h1>` y `<p aria-live="polite">` en el DOM con copy descriptivo por estado.
- Respeto a `prefers-reduced-motion`: frame de ala fijo y sin bobbing acelerado.

---

## Cómo correrlo

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build de producción
npm run build
npm start

# Lint
npm run lint
```

Abrir `http://localhost:3000` en el navegador.

**Controles:**
- `Espacio` o `↑` — volar / iniciar / reiniciar
- Click — volar / iniciar / reiniciar
- Tap (móvil) — volar / iniciar / reiniciar

---

## Criterios de aceptación — estado

### CUBIERTOS ✅

| Criterio | Estado |
|---|---|
| AC1.1 — Canvas escala responsivamente sin deformarse | ✅ Implementado (cálculo de `scale` con `resize` listener) |
| AC1.2 — Game loop a ~60 FPS con requestAnimationFrame | ✅ Con delta-time normalizado |
| AC1.3 — Estado inicial `idle` con mensaje de inicio | ✅ Mensaje, título y pájaro flotando |
| AC1.4 — Input en `idle` pasa a `playing` | ✅ |
| AC2.1 — Pájaro cae por gravedad sin input | ✅ |
| AC2.2 — Flap impulsa hacia arriba inmediatamente | ✅ |
| AC2.3 — Rotación visual según velocidad | ✅ |
| AC2.4 — Posición X fija del pájaro | ✅ (`birdX = 100`) |
| AC3.1 — Tuberías aparecen desde la derecha a intervalos regulares | ✅ |
| AC3.2 — Hueco a altura aleatoria | ✅ |
| AC3.3 — Tuberías se mueven a velocidad constante | ✅ |
| AC3.4 — Tuberías fuera del canvas se eliminan | ✅ |
| AC4.1 — Marcador muestra 0 al inicio | ✅ |
| AC4.2 — Marcador +1 por tubería pasada | ✅ |
| AC4.3 — Una tubería no suma más de 1 punto | ✅ (flag `scored`) |
| AC5.1 — Colisión con suelo termina el juego | ✅ |
| AC5.2 — Colisión con techo termina el juego | ✅ |
| AC5.3 — Colisión con tubería termina el juego | ✅ (circle-rect) |
| AC5.4 — Hueco libre de colisión | ✅ |
| AC6.1 — Estado cambia a `gameover` y se muestra overlay | ✅ |
| AC6.2 — Overlay muestra puntaje y mejor puntaje | ✅ |
| AC6.3 — Input en `gameover` reinicia todo | ✅ |
| AC7.1 — High score persiste tras recargar | ✅ |
| AC7.2 — High score se actualiza al superarlo | ✅ |
| AC7.3 — Indicador "¡Nueva marca!" al batir récord | ✅ |
| AC8.1 — Barra espaciadora produce flap | ✅ |
| AC8.2 — Click produce flap | ✅ |
| AC8.3 — Tap táctil produce flap | ✅ |
| AC8.4 — No hay scroll ni zoom al interactuar | ✅ (`preventDefault`, `touch-action`, viewport) |
| AC9.1 — Fondo de cielo colorido | ✅ (degradado + nubes) |
| AC9.2 — Tuberías verdes con estilo retro | ✅ (biselado, borde, cap) |
| AC9.3 — Suelo con textura desplazable | ✅ |
| AC9.4 — Pájaro colorido con animación de aleteo | ✅ |
| AC9.5 — Marcador con tipografía legible | ✅ (monoespaciada con sombra) |
| Flujo crítico #1 — Ciclo abrir→jugar→game over→reiniciar | ✅ |
| Flujo crítico #2 — High score persiste tras recarga | ✅ |
| Flujo crítico #3 — Móvil: canvas escala, touch sin scroll/zoom | ✅ |

### PENDIENTES / Limitaciones ⚠️

| Aspecto | Detalle |
|---|---|
| Sin tests automatizados | No se crearon archivos de test (no se solicitaban en la spec). |
| Sin efectos de sonido | La spec lo marcaba como opcional/fuera de alcance; no se implementaron. |
| Sin escalado de dificultad | La velocidad de tuberías es fija (`pipeSpeed = 2.5`); la spec indicaba que el escalado era opcional. |
| `render.ts` no separado | El plan mencionaba un módulo `render.ts` independiente; las funciones de dibujo están integradas en `FlappyBirdGame.tsx`. Funcionalmente equivalente pero no como módulo aparte. |
| `isNewBest` persiste en `gameover`→`idle` | Al reiniciar desde gameover el flag `isNewBest` se resetea correctamente, pero no hay transición animada entre estados. |
| Error de canvas sin soporte 2D | El UX plan mencionaba un fallback `<div class="alert alert-error">` si el contexto 2D no está disponible. En el código se hace un early return silencioso (`if (!ctx) return`) sin mostrar mensaje de error al usuario. |

---

## Conclusión

El proyecto implementa **todas las épicas y criterios de aceptación** definidos en la spec. El juego es completamente funcional: ciclo de juego completo, físicas, colisiones, puntuación, persistencia de high score, controles multi-input y estilo visual retro. Las únicas limitaciones son menores (sin tests, sin sonido, fallback de canvas sin UI de error) y ninguna afecta a los flujos críticos del usuario.
