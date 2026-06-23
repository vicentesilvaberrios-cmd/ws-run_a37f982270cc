# Spec — Flappy Bird Web Game

## 1. Objetivo y Alcance

### Objetivo
Construir un juego web tipo Flappy Bird, jugable 100% en el navegador, donde el jugador controla un pájaro que debe esquivar tuberías verdes volando entre los huecos. El juego usa HTML5 Canvas, controles de teclado y táctiles, estilo retro colorido.

### Incluido en el alcance
- Renderizado del juego en un `<canvas>` HTML5 dentro de una app Next.js (App Router) + TypeScript.
- Físicas: gravedad constante sobre el pájaro, impulso hacia arriba al accionar.
- Generación procedural de tuberías (verdes) que se desplazan de derecha a izquierda con huecos a alturas aleatorias.
- Sistema de puntuación: +1 por cada tubería superada.
- Detección de colisiones: pájaro vs. tuberías, pájaro vs. suelo, pájaro vs. techo.
- Estados de juego: `idle` (inicio), `playing`, `gameover`.
- Pantalla de Game Over con puntaje obtenido, mejor puntaje y botón de reinicio.
- Persistencia del high score en `localStorage` (no requiere backend ni base de datos).
- Controles responsivos: barra espaciadora / click / tap.
- Estilo visual retro colorido (paleta vibrante, pixel-art o flat colorido).

### Fuera de alcance
- Backend, base de datos, API, endpoints de servidor.
- Autenticación de usuarios o perfiles.
- Tabla de líderes global / multiplayer.
- Niveles o dificultad configurable (la dificultad es fija/escala naturalmente con la velocidad).
- Efectos de sonido (no solicitados; opcionales pero no requeridos).
- Despliegue móvil nativo / PWA install.

### Nota de arquitectura
**No requiere backend.** Toda la lógica del juego, estado y persistencia viven en el cliente. El high score se guarda en `localStorage` bajo la clave `flappy-highscore`. No se persiste nada en el filesystem del servidor ni en base de datos.

---

## 2. Épicas y Funcionalidades

### ÉPICA 1 — Motor del juego (Canvas + game loop)
- 1.1 Inicializar un `<canvas>` con dimensiones fijas lógicas (ej. 400×600) y escalado responsivo al contenedor manteniendo aspect ratio.
- 1.2 Implementar game loop con `requestAnimationFrame` a ~60 FPS con delta-time normalizado.
- 1.3 Gestionar tres estados de juego: `idle`, `playing`, `gameover`.
- 1.4 En estado `idle`, mostrar mensaje de inicio ("Click o Espacio para jugar") con pájaro flotando animado.
- 1.5 Transición `idle → playing` al recibir input del usuario.
- 1.6 Transición `playing → gameover` al detectar colisión.
- 1.7 Transición `gameover → idle` (o directo a `playing`) al recibir input de reinicio.

### ÉPICA 2 — Pájaro y físicas
- 2.1 Entidad `Bird` con posición (x, y), velocidad vertical, tamaño (radio de colisión).
- 2.2 Aplicar gravedad constante cada frame (aceleración hacia abajo).
- 2.3 Aplicar impulso (flap) hacia arriba al recibir input: velocidad vertical = `flapStrength` (negativa).
- 2.4 Limitar velocidad vertical máxima (caída libre con tope).
- 2.5 Rotación visual del pájaro según velocidad (inclina hacia arriba al subir, hacia abajo al caer).
- 2.6 Animación de aleteo (cambio de frame / ángulo de alas) en bucle.
- 2.7 Posición x fija del pájaro (aprox. 25-30% del ancho del canvas); solo se mueve en Y.

### ÉPICA 3 — Tuberías
- 3.1 Entidad `Pipe` con: posición x, ancho fijo, posición Y del hueco (gapY), altura del hueco (gapHeight).
- 3.2 Generar tuberías a intervalos regulares (cada N píxeles de desplazamiento o cada N ms) desde fuera del borde derecho.
- 3.3 Asignar `gapY` aleatorio dentro de un rango seguro (entre un mínimo y un máximo que deja margen con suelo y techo).
- 3.4 Mover todas las tuberías hacia la izquierda a `pipeSpeed` por frame.
- 3.5 Eliminar tuberías que salieron completamente por la izquierda (optimización).
- 3.6 Renderizar cada tubería como dos rectángulos verdes (superior e inferior) que dejan el hueco en el medio, con estilo retro (borde/biselado colorido).
- 3.7 La velocidad de las tuberías puede aumentar ligeramente con el progreso (opcional, para escalado de dificultad).

### ÉPICA 4 — Puntuación
- 4.1 Contador de puntos inicializado en 0 al empezar.
- 4.2 Detectar cuando el pájaro cruza el centro x de una tubería (pasa el hueco) → incrementar puntaje en 1.
- 4.3 Marcar cada tubería como "scored" para no contarla dos veces.
- 4.4 Renderizar el puntaje actual en grande en la parte superior central del canvas durante `playing`.

### ÉPICA 5 — Colisiones
- 5.1 Colisión pájaro-suelo: si `bird.y + bird.radius >= floorY` → game over.
- 5.2 Colisión pájaro-techo: si `bird.y - bird.radius <= 0` → game over.
- 5.3 Colisión pájaro-tubería: para cada tubería activa, si el pájaro se solapa en X con el rango de la tubería Y su Y cae fuera del hueco → game over.
- 5.4 Usar colisión por rectángulo (AABB) o círculo-rectángulo para precisión.

### ÉPICA 6 — Game Over y reinicio
- 6.1 Al colisionar, detener el game loop (congelar posición) y cambiar estado a `gameover`.
- 6.2 Mostrar overlay de Game Over sobre el canvas: título "Game Over", puntaje obtenido, mejor puntaje, botón/instrucción "Click o Espacio para reiniciar".
- 6.3 Comparar puntaje obtenido con high score guardado; si es mayor, actualizarlo y guardarlo en `localStorage`.
- 6.4 Al recibir input de reinicio: resetear todas las entidades (pájaro, tuberías, puntaje) y volver a `idle` o `playing`.

### ÉPICA 7 — High Score persistente
- 7.1 Al iniciar la app, leer `localStorage.getItem('flappy-highscore')` → `highScore` (default 0 si no existe).
- 7.2 Mostrar `highScore` en la pantalla de inicio (idle) y en la pantalla de Game Over.
- 7.3 Tras cada Game Over, si `score > highScore`, actualizar variable y `localStorage.setItem('flappy-highscore', score)`.
- 7.4 Mostrar indicador "New Best!" cuando se supera el récord.

### ÉPICA 8 — Controles responsivos (teclado + touch)
- 8.1 Teclado: tecla `Space` (y opcionalmente `ArrowUp`) → flap en `idle`/`playing` o reiniciar en `gameover`.
- 8.2 Mouse: `click` sobre el canvas → flap / reiniciar.
- 8.3 Touch: `touchstart` sobre el canvas → flap / reiniciar (con `preventDefault` para evitar scroll/zoom).
- 8.4 Prevenir comportamiento por defecto del navegador (espacio hace scroll, touch hace zoom) en el área de juego.

### ÉPICA 9 — Estilo visual retro colorido
- 9.1 Paleta de colores vibrante: cielo azul claro de fondo, tuberías verdes brillantes, pájaro amarillo/naranja, suelo marrón/verde.
- 9.2 Fondo con cielo degradado o color sólido + nubes decorativas simples (opcionales, estáticas o en parallax lento).
- 9.3 Suelo texturizado (patrón de líneas o bloques) que se desplaza para dar sensación de movimiento.
- 9.4 Tipografía retro/pixelada para el marcador (puede ser CSS o canvas rendering con fuente monoespaciada).
- 9.5 Diseño responsive: el canvas escala manteniendo aspect ratio, centrado en la pantalla, con fondo de página complementario.

---

## 3. Modelo de Datos

No hay modelo de datos de servidor. Toda la data es en memoria del cliente (objetos TS) + un valor en `localStorage`.

### Entidades en memoria (TypeScript)

```typescript
type GameState = 'idle' | 'playing' | 'gameover';

interface Bird {
  x: number;        // posición X fija (px lógicos)
  y: number;        // posición Y (px lógicos)
  velocity: number; // velocidad vertical (px/frame)
  radius: number;   // radio de colisión (px)
  rotation: number; // rotación visual (radianes)
  frame: number;    // frame de animación de aleteo (0-1-2)
}

interface Pipe {
  id: number;        // identificador único incremental
  x: number;         // posición X del borde izquierdo de la tubería
  width: number;     // ancho de la tubería (px)
  gapY: number;      // posición Y del centro del hueco (px)
  gapHeight: number; // altura del hueco (px)
  scored: boolean;   // si el pájaro ya pasó esta tubería
}

interface GameConfig {
  canvasWidth: number;    // 400
  canvasHeight: number;   // 600
  birdX: number;          // ~100 (25% del ancho)
  birdRadius: number;     // ~12
  gravity: number;        // ~0.5 px/frame²
  flapStrength: number;   // ~-8 px/frame
  maxFallSpeed: number;   // ~10 px/frame
  pipeWidth: number;      // ~60
  pipeGap: number;        // ~150
  pipeSpacing: number;    // ~220 px entre tuberías
  pipeSpeed: number;      // ~2.5 px/frame
  floorHeight: number;    // ~80
}
```

### Persistencia

| Clave localStorage | Tipo | Descripción |
|---|---|---|
| `flappy-highscore` | `number` (stringificado) | Mejor puntaje histórico del jugador en este navegador |

---

## 4. Rutas / Páginas (App Router)

| Ruta | Archivo | Descripción |
|---|---|---|
| `/` | `app/page.tsx` | Página principal y única. Renderiza el componente del juego (`FlappyBirdGame`) a pantalla completa, centrado, con fondo decorativo. |

> Solo se necesita una página. Todo el juego ocurre dentro del canvas en la ruta raíz.

---

## 5. Endpoints API

**No hay endpoints API.** La aplicación es 100% cliente. No requiere backend, base de datos ni servicios de servidor. Toda la lógica del juego, el estado y la persistencia del high score viven en el navegador mediante `localStorage`.

---

## 6. Criterios de Aceptación por Épica

### ÉPICA 1 — Motor del juego
- [ ] AC1.1: El canvas se renderiza y escala responsivamente sin deformarse al cambiar el tamaño de la ventana.
- [ ] AC1.2: El game loop corre a ~60 FPS con `requestAnimationFrame`.
- [ ] AC1.3: Al cargar la página, el estado es `idle` y se muestra el mensaje de inicio.
- [ ] AC1.4: Al presionar espacio/click/tap en `idle`, el juego pasa a `playing`.

### ÉPICA 2 — Pájaro y físicas
- [ ] AC2.1: El pájaro cae aceleradamente por gravedad cuando no hay input.
- [ ] AC2.2: Al hacer flap, el pájaro se impulsa hacia arriba inmediatamente.
- [ ] AC2.3: El pájaro rota visualmente según su velocidad vertical.
- [ ] AC2.4: La posición X del pájaro permanece fija durante toda la partida.

### ÉPICA 3 — Tuberías
- [ ] AC3.1: Las tuberías aparecen desde el borde derecho a intervalos regulares.
- [ ] AC3.2: El hueco de cada tubería está a una altura aleatoria diferente.
- [ ] AC3.3: Las tuberías se mueven hacia la izquierda a velocidad constante.
- [ ] AC3.4: Las tuberías que salen del canvas por la izquierda se eliminan de memoria.

### ÉPICA 4 — Puntuación
- [ ] AC4.1: El marcador muestra 0 al inicio de cada partida.
- [ ] AC4.2: El marcador incrementa en 1 cada vez que el pájaro pasa completamente una tubería.
- [ ] AC4.3: Una misma tubería nunca suma más de 1 punto.

### ÉPICA 5 — Colisiones
- [ ] AC5.1: Si el pájaro toca el suelo, el juego termina inmediatamente.
- [ ] AC5.2: Si el pájaro toca el techo, el juego termina inmediatamente.
- [ ] AC5.3: Si el pájaro toca una tubería (parte superior o inferior), el juego termina inmediatamente.
- [ ] AC5.4: El pájaro puede pasar libremente por el hueco de las tuberías sin falsear colisión.

### ÉPICA 6 — Game Over y reinicio
- [ ] AC6.1: Al colisionar, el estado cambia a `gameover` y se muestra la pantalla de Game Over.
- [ ] AC6.2: La pantalla de Game Over muestra el puntaje obtenido y el mejor puntaje.
- [ ] AC6.3: Al presionar espacio/click/tap en `gameover`, el juego se reinicia: pájaro en posición inicial, sin tuberías, puntaje en 0.

### ÉPICA 7 — High Score persistente
- [ ] AC7.1: Al recargar la página, el high score previamente guardado se muestra correctamente.
- [ ] AC7.2: Si se supera el high score, este se actualiza y persiste tras recargar.
- [ ] AC7.3: Se muestra un indicador "New Best!" cuando se bate el récord en una partida.

### ÉPICA 8 — Controles responsivos
- [ ] AC8.1: La barra espaciadora produce un flap.
- [ ] AC8.2: Un click del mouse sobre el canvas produce un flap.
- [ ] AC8.3: Un tap táctil sobre el canvas produce un flap en dispositivos móviles.
- [ ] AC8.4: No se produce scroll de página ni zoom al interactuar con el canvas.

### ÉPICA 9 — Estilo visual retro colorido
- [ ] AC9.1: El fondo del canvas es un cielo colorido (azul claro o degradado).
- [ ] AC9.2: Las tuberías son verdes con un estilo visual retro (borde/biselado).
- [ ] AC9.3: El suelo tiene textura o patrón visible y se desplaza para dar sensación de movimiento.
- [ ] AC9.4: El pájaro tiene un diseño colorido (amarillo/naranja) con animación de aleteo.
- [ ] AC9.5: El marcador usa tipografía destacada y legible durante el juego.

---

## 7. Flujos de Usuario Críticos

### Rol: Jugador (único rol)

#### Flujo crítico #1 — Jugar una partida completa (camino feliz)

1. **Abrir el juego**: El usuario navega a `/` → ve el canvas con estado `idle`: pájaro flotando animado, mensaje "Click o Espacio para jugar", y el high score actual visible.
2. **Iniciar partida**: El usuario presiona `Space` (o hace click / tap en el canvas) → el estado cambia a `playing`, el pájaro comienza a caer por gravedad, aparecen las primeras tuberías desde la derecha.
3. **Volar**: El usuario presiona `Space` repetidamente (o click/tap) → el pájaro se impulsa hacia arriba con cada input, alternando subidas y caídas para mantenerse en el aire.
4. **Esquivar tuberías**: Las tuberías avanzan hacia la izquierda; el usuario ajusta la altura del pájaro para que pase por el hueco de cada tubería.
5. **Sumar puntos**: Cada vez que el pájaro cruza una tubería, el marcador del canvas incrementa en 1.
6. **Colisionar (fin de partida)**: El pájaro choca contra una tubería, el suelo o el techo → el juego se detiene, estado = `gameover`.
7. **Ver resultado**: La pantalla de Game Over muestra: título "Game Over", puntaje obtenido, mejor puntaje, y si batió el récord un mensaje "New Best!". El high score se guarda en `localStorage`.
8. **Reiniciar**: El usuario presiona `Space` / click / tap → el juego se reinicia (pájaro en posición inicial, tuberías limpiadas, puntaje en 0) y vuelve al estado `idle` o directamente a `playing`.

> **Este flujo es el criterio de aceptación #1 del proyecto.** Si un usuario no puede completar el ciclo abrir → jugar → ver game over → reiniciar, el proyecto se considera un fracaso.

#### Flujo crítico #2 — Ver y batir el high score

1. El usuario juega una partida (flujo #1) y obtiene un puntaje.
2. En la pantalla de Game Over, si el puntaje supera el high score anterior, se muestra "New Best!" y el valor se actualiza.
3. El usuario recarga la página (F5) → en la pantalla `idle` se muestra el nuevo high score persistido desde `localStorage`.

#### Flujo crítico #3 — Jugar en dispositivo móvil (touch)

1. El usuario abre `/` en un teléfono móvil.
2. El canvas se escala para caber en la pantalla manteniendo proporción.
3. El usuario toca la pantalla (`touchstart`) → el pájaro hace flap.
4. No se produce scroll ni zoom no deseado en la página al tocar.
5. El resto del flujo es idéntico al flujo #1.

---

## 8. Estructura de Archivos (referencia para implementación)

```
app/
  page.tsx                  → Página raíz, renderiza <FlappyBirdGame />
  layout.tsx               → Layout mínimo, metadatos, fondo de página
  globals.css              → Estilos globales (centrado, fondo, no-select)
components/
  FlappyBirdGame.tsx        → Componente cliente principal: canvas, game loop, estados, input
  game/
    constants.ts            → GameConfig (dimensiones, física, speeds)
    types.ts                → Interfaces Bird, Pipe, GameState
    useFlappyGame.ts        → Hook con toda la lógica del game loop (o lógica inline en el componente)
```

> La estructura exacta puede variar, pero el componente del juego debe ser un Client Component (`'use client'`) porque usa `canvas`, `requestAnimationFrame`, `window` y `localStorage`.

---

## 9. Stack y Decisiones Técnicas

| Aspecto | Decisión |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Rendering | HTML5 Canvas 2D (`getContext('2d')`) |
| Game loop | `requestAnimationFrame` con delta-time |
| Estado | Estado local del componente (refs para mutables del loop, React state para UI overlays) |
| Persistencia | `localStorage` (`flappy-highscore`) |
| Estilos | CSS Modules / Tailwind para layout de la página; Canvas API para todo lo del juego |
| Cliente | `'use client'` — toda la lógica del juego corre en el navegador |
| Backend | **No requerido** |
| Deploy | Railway/contenedor — el filesystem efímero no es problema porque no se usa |

---

## 10. Resumen de No-Backend

Esta aplicación es un juego 100% cliente. **No tiene endpoints API, no tiene base de datos, no tiene lógica de servidor.** El único dato persistente (high score) se guarda en `localStorage` del navegador. Esto es la decisión correcta y intencional, no una omisión.
