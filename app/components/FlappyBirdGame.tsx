"use client";

import { useEffect, useRef, useState } from "react";
import { useFlappyGame } from "./game/useFlappyGame";
import { GameConfig } from "./game/constants";

const SKY_TOP = "#4ec0ca";
const SKY_BOTTOM = "#71c5cf";
const PIPE_GREEN = "#73bf2e";
const PIPE_GREEN_DARK = "#558022";
const PIPE_GREEN_LIGHT = "#9fdc50";
const PIPE_BORDER = "#3a5a1a";
const BIRD_BODY = "#f7d51d";
const BIRD_BODY_DARK = "#e0a800";
const BIRD_WING = "#ffffff";
const BIRD_BEAK = "#ff6600";
const FLOOR_COLOR = "#ded895";
const FLOOR_DARK = "#c9c273";
const CLOUD_COLOR = "rgba(255,255,255,0.6)";

const subtitleCopy: Record<string, string> = {
  idle: "Pulsa Espacio, haz clic o toca la pantalla para empezar",
  playing: "Vuela: pulsa Espacio o toca la pantalla",
  gameover: "Game Over. Pulsa Espacio, haz clic o toca para volver a jugar",
};

const ariaLabelCopy = (state: string, score: number, highScore: number): string => {
  if (state === "idle")
    return `Flappy Bird. Pulsa Espacio para empezar. Mejor marca: ${highScore}.`;
  if (state === "playing") return `Flappy Bird. Puntaje ${score}.`;
  return `Game Over. Puntaje ${score}. Mejor marca ${highScore}. Pulsa Espacio para reiniciar.`;
};

export default function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);
  const game = useFlappyGame();
  const { state, score, highScore, isNewBest, bird, pipes, flap } = game;

  // Guardar refs para el render loop
  const stateRenderRef = useRef(state);
  const scoreRenderRef = useRef(score);
  const highScoreRenderRef = useRef(highScore);
  const isNewBestRenderRef = useRef(isNewBest);
  const birdRenderRef = useRef(bird);
  const pipesRenderRef = useRef(pipes);
  const reduceMotionRef = useRef(false);

  stateRenderRef.current = state;
  scoreRenderRef.current = score;
  highScoreRenderRef.current = highScore;
  isNewBestRenderRef.current = isNewBest;
  birdRenderRef.current = bird;
  pipesRenderRef.current = pipes;

  useEffect(() => {
    setMounted(true);
    reduceMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Responsive scaling
    const updateScale = () => {
      const vw = window.innerWidth - 32;
      const vh = window.innerHeight - 100;
      const s = Math.min(vw / GameConfig.canvasWidth, vh / GameConfig.canvasHeight, 1);
      setScale(Math.max(s, 0.3));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  // Render loop
  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const groundOffsetRef = { v: 0 };
    let cloudOffset = 0;

    const render = () => {
      const W = GameConfig.canvasWidth;
      const H = GameConfig.canvasHeight;
      const s = stateRenderRef.current;
      const sc = scoreRenderRef.current;
      const hs = highScoreRenderRef.current;
      const nb = isNewBestRenderRef.current;
      const b = birdRenderRef.current;
      const ps = pipesRenderRef.current;
      const floorY = H - GameConfig.floorHeight;

      // Cielo degradado
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, SKY_TOP);
      grad.addColorStop(1, SKY_BOTTOM);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Nubes decorativas
      cloudOffset += s === "playing" ? 0.3 : 0.1;
      drawCloud(ctx, ((cloudOffset * 0.5) % (W + 80)) - 80, 80, 40);
      drawCloud(ctx, ((cloudOffset * 0.3 + 200) % (W + 80)) - 80, 150, 30);
      drawCloud(ctx, ((cloudOffset * 0.7 + 350) % (W + 80)) - 80, 60, 35);

      // Tuberías
      for (const p of ps) {
        drawPipe(ctx, p, floorY);
      }

      // Suelo
      if (s === "playing") {
        groundOffsetRef.v = (groundOffsetRef.v + GameConfig.pipeSpeed) % 24;
      }
      drawGround(ctx, groundOffsetRef.v, floorY, H, W);

      // Pájaro
      drawBird(ctx, b, reduceMotionRef.current);

      // Overlays
      if (s === "idle") {
        drawIdleOverlay(ctx, W, hs, reduceMotionRef.current);
      } else if (s === "playing") {
        drawScore(ctx, sc, W);
      } else if (s === "gameover") {
        drawGameOverOverlay(ctx, W, H, sc, hs, nb);
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [mounted]);

  const handlePointer = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    flap();
  };

  if (!mounted) {
    return (
      <div
        style={{
          width: GameConfig.canvasWidth,
          height: GameConfig.canvasHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: SKY_BOTTOM,
          borderRadius: "var(--radius)",
          color: "#fff",
          fontSize: "var(--fs-base)",
        }}
      >
        Cargando juego…
      </div>
    );
  }

  const canvasW = GameConfig.canvasWidth * scale;
  const canvasH = GameConfig.canvasHeight * scale;

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--sp-2)",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "manipulation",
      }}
    >
      <h1 className="title" style={{ fontSize: "var(--fs-xl)" }}>
        Flappy Bird
      </h1>

      <canvas
        ref={canvasRef}
        width={GameConfig.canvasWidth}
        height={GameConfig.canvasHeight}
        role="img"
        aria-label={ariaLabelCopy(state, score, highScore)}
        onMouseDown={handlePointer}
        onTouchStart={handlePointer}
        style={{
          width: canvasW,
          height: canvasH,
          maxWidth: "100%",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow)",
          cursor: "pointer",
          touchAction: "manipulation",
        }}
      />

      <p className="subtitle" aria-live="polite">
        {subtitleCopy[state]}
      </p>
    </div>
  );
}

/* ====== Funciones de renderizado del canvas ====== */

function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number
) {
  ctx.fillStyle = CLOUD_COLOR;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.arc(x + r * 0.8, y, r * 0.7, 0, Math.PI * 2);
  ctx.arc(x - r * 0.8, y, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawPipe(
  ctx: CanvasRenderingContext2D,
  pipe: { x: number; width: number; gapY: number; gapHeight: number },
  floorY: number
) {
  const topH = pipe.gapY - pipe.gapHeight / 2;
  const bottomY = pipe.gapY + pipe.gapHeight / 2;
  const bottomH = floorY - bottomY;

  // Tubería superior
  drawPipeRect(ctx, pipe.x, 0, pipe.width, topH);
  // Tubería inferior
  drawPipeRect(ctx, pipe.x, bottomY, pipe.width, bottomH);
}

function drawPipeRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  if (h <= 0) return;

  // Cuerpo principal
  ctx.fillStyle = PIPE_GREEN;
  ctx.fillRect(x, y, w, h);

  // Biselado izquierdo (highlight)
  ctx.fillStyle = PIPE_GREEN_LIGHT;
  ctx.fillRect(x + 4, y, 6, h);

  // Biselado derecho (shadow)
  ctx.fillStyle = PIPE_GREEN_DARK;
  ctx.fillRect(x + w - 8, y, 8, h);

  // Borde
  ctx.strokeStyle = PIPE_BORDER;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // Cap (extremo más ancho)
  const capH = 24;
  const capX = x - 3;
  const capW = w + 6;

  // Determinar si el cap va arriba o abajo del rect
  if (y === 0) {
    // Tubería superior: cap al final (abajo)
    const capY = y + h - capH;
    ctx.fillStyle = PIPE_GREEN;
    ctx.fillRect(capX, capY, capW, capH);
    ctx.fillStyle = PIPE_GREEN_LIGHT;
    ctx.fillRect(capX + 4, capY, 6, capH);
    ctx.fillStyle = PIPE_GREEN_DARK;
    ctx.fillRect(capX + capW - 8, capY, 8, capH);
    ctx.strokeStyle = PIPE_BORDER;
    ctx.strokeRect(capX, capY, capW, capH);
  } else {
    // Tubería inferior: cap al inicio (arriba)
    ctx.fillStyle = PIPE_GREEN;
    ctx.fillRect(capX, y, capW, capH);
    ctx.fillStyle = PIPE_GREEN_LIGHT;
    ctx.fillRect(capX + 4, y, 6, capH);
    ctx.fillStyle = PIPE_GREEN_DARK;
    ctx.fillRect(capX + capW - 8, y, 8, capH);
    ctx.strokeStyle = PIPE_BORDER;
    ctx.strokeRect(capX, y, capW, capH);
  }
}

function drawGround(
  ctx: CanvasRenderingContext2D,
  offset: number,
  floorY: number,
  H: number,
  W: number
) {
  ctx.fillStyle = FLOOR_COLOR;
  ctx.fillRect(0, floorY, W, H - floorY);

  // Patrón de líneas diagonales
  ctx.fillStyle = FLOOR_DARK;
  const tileW = 12;
  for (let i = -1; i < W / tileW + 1; i++) {
    const tx = i * tileW - (offset % tileW);
    ctx.fillRect(tx, floorY, tileW / 2, 8);
  }

  // Línea superior del suelo
  ctx.fillStyle = PIPE_GREEN_DARK;
  ctx.fillRect(0, floorY, W, 3);
}

function drawBird(
  ctx: CanvasRenderingContext2D,
  bird: { x: number; y: number; radius: number; rotation: number; frame: number },
  reduceMotion: boolean
) {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  const r = bird.radius;

  // Cuerpo
  ctx.fillStyle = BIRD_BODY;
  ctx.beginPath();
  ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
  ctx.fill();

  // Ala
  const wingFrame = reduceMotion ? 1 : Math.floor(bird.frame) % 3;
  ctx.fillStyle = BIRD_WING;
  ctx.beginPath();
  if (wingFrame === 0) {
    ctx.ellipse(-3, 2, 6, 4, 0, 0, Math.PI * 2);
  } else if (wingFrame === 1) {
    ctx.ellipse(-3, 0, 6, 4, 0, 0, Math.PI * 2);
  } else {
    ctx.ellipse(-3, -2, 6, 4, 0, 0, Math.PI * 2);
  }
  ctx.fill();

  // Ojo
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(5, -4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(6, -4, 2, 0, Math.PI * 2);
  ctx.fill();

  // Pico
  ctx.fillStyle = BIRD_BEAK;
  ctx.beginPath();
  ctx.moveTo(r, -2);
  ctx.lineTo(r + 8, 0);
  ctx.lineTo(r, 3);
  ctx.closePath();
  ctx.fill();

  // Borde del cuerpo
  ctx.strokeStyle = BIRD_BODY_DARK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function setCanvasFont(
  ctx: CanvasRenderingContext2D,
  size: number,
  weight = "bold"
) {
  ctx.font = `${weight} ${size}px ui-monospace, "Courier New", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
}

function drawTextWithShadow(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color = "#fff"
) {
  setCanvasFont(ctx, size);
  ctx.lineWidth = Math.max(2, size / 8);
  ctx.strokeStyle = "rgba(0,0,0,0.7)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawScore(ctx: CanvasRenderingContext2D, score: number, W: number) {
  drawTextWithShadow(ctx, String(score), W / 2, 60, 36);
}

function drawIdleOverlay(
  ctx: CanvasRenderingContext2D,
  W: number,
  highScore: number,
  _reduceMotion: boolean
) {
  drawTextWithShadow(ctx, "FLAPPY BIRD", W / 2, 140, 28);
  drawTextWithShadow(
    ctx,
    "Pulsa Espacio, haz clic o toca para empezar",
    W / 2,
    220,
    13
  );
  if (highScore > 0) {
    drawTextWithShadow(ctx, `Mejor marca: ${highScore}`, W / 2, 260, 16);
  }
}

function drawGameOverOverlay(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  score: number,
  highScore: number,
  isNewBest: boolean
) {
  // Panel semitransparente
  const panelW = 280;
  const panelH = isNewBest ? 210 : 180;
  const panelX = (W - panelW) / 2;
  const panelY = (H - panelH) / 2 - 20;

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  roundRect(ctx, panelX, panelY, panelW, panelH, 12);
  ctx.fill();

  let cy = panelY + 40;
  drawTextWithShadow(ctx, "Game Over", W / 2, cy, 26);
  cy += 40;
  drawTextWithShadow(ctx, `Puntaje: ${score}`, W / 2, cy, 18);
  cy += 30;
  drawTextWithShadow(ctx, `Mejor marca: ${highScore}`, W / 2, cy, 18);

  if (isNewBest) {
    cy += 30;
    // Badge ¡Nueva marca!
    const badgeText = "¡Nueva marca!";
    setCanvasFont(ctx, 14);
    const badgeW = ctx.measureText(badgeText).width + 24;
    const badgeX = (W - badgeW) / 2;
    ctx.fillStyle = "#f7d51d";
    roundRect(ctx, badgeX, cy - 12, badgeW, 24, 12);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.fillText(badgeText, W / 2, cy);
    cy += 30;
  } else {
    cy += 30;
  }

  drawTextWithShadow(
    ctx,
    "Pulsa Espacio, haz clic o toca para volver a jugar",
    W / 2,
    cy,
    11
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
