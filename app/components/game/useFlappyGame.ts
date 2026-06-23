"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Bird, GameState, Pipe } from "./types";
import { GameConfig, HIGH_SCORE_KEY } from "./constants";

function readHighScore(): number {
  try {
    const v = localStorage.getItem(HIGH_SCORE_KEY);
    return v ? parseInt(v, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

function saveHighScore(v: number): void {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(v));
  } catch {
    /* modo privado o bloqueado — ignorar */
  }
}

function createBird(): Bird {
  return {
    x: GameConfig.birdX,
    y: GameConfig.canvasHeight / 2,
    velocity: 0,
    radius: GameConfig.birdRadius,
    rotation: 0,
    frame: 0,
  };
}

function randomGapY(): number {
  const min = 80;
  const max = GameConfig.canvasHeight - GameConfig.floorHeight - 80;
  return Math.random() * (max - min) + min;
}

export interface FlappyGameApi {
  state: GameState;
  score: number;
  highScore: number;
  isNewBest: boolean;
  bird: Bird;
  pipes: Pipe[];
  flap: () => void;
}

export function useFlappyGame(): FlappyGameApi {
  const [state, setState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);

  const birdRef = useRef<Bird>(createBird());
  const pipesRef = useRef<Pipe[]>([]);
  const stateRef = useRef<GameState>("idle");
  const scoreRef = useRef(0);
  const highScoreRef = useRef(0);
  const pipeIdRef = useRef(0);
  const spawnAccRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const idleBobRef = useRef(0);

  // Cargar high score al montar
  useEffect(() => {
    const hs = readHighScore();
    highScoreRef.current = hs;
    setHighScore(hs);
  }, []);

  const syncState = useCallback(() => {
    setState(stateRef.current);
    setScore(scoreRef.current);
    setHighScore(highScoreRef.current);
  }, []);

  const resetGame = useCallback(() => {
    birdRef.current = createBird();
    pipesRef.current = [];
    scoreRef.current = 0;
    spawnAccRef.current = 0;
    pipeIdRef.current = 0;
    setIsNewBest(false);
    setScore(0);
  }, []);

  const flap = useCallback(() => {
    if (stateRef.current === "idle") {
      resetGame();
      stateRef.current = "playing";
      birdRef.current.velocity = GameConfig.flapStrength;
      syncState();
    } else if (stateRef.current === "playing") {
      birdRef.current.velocity = GameConfig.flapStrength;
    } else if (stateRef.current === "gameover") {
      resetGame();
      stateRef.current = "idle";
      syncState();
    }
  }, [resetGame, syncState]);

  // Game loop
  useEffect(() => {
    const loop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / (1000 / 60), 3);
      lastTimeRef.current = time;

      const s = stateRef.current;

      if (s === "idle") {
        // Pájaro flotando suavemente
        idleBobRef.current += 0.05 * dt;
        birdRef.current.y =
          GameConfig.canvasHeight / 2 +
          Math.sin(idleBobRef.current) * 12;
        birdRef.current.frame += 0.15 * dt;
        birdRef.current.rotation = 0;
      } else if (s === "playing") {
        const bird = birdRef.current;

        // Gravedad
        bird.velocity += GameConfig.gravity * dt;
        if (bird.velocity > GameConfig.maxFallSpeed) {
          bird.velocity = GameConfig.maxFallSpeed;
        }
        bird.y += bird.velocity * dt;

        // Rotación según velocidad
        const targetRot =
          bird.velocity < 0 ? -0.4 : Math.min(bird.velocity / 10, 1.2);
        bird.rotation = targetRot;

        // Animación de aleteo
        bird.frame += (bird.velocity < 0 ? 0.4 : 0.15) * dt;

        // Spawn de tuberías
        spawnAccRef.current += GameConfig.pipeSpeed * dt;
        if (spawnAccRef.current >= GameConfig.pipeSpacing) {
          spawnAccRef.current = 0;
          pipeIdRef.current += 1;
          pipesRef.current.push({
            id: pipeIdRef.current,
            x: GameConfig.canvasWidth,
            width: GameConfig.pipeWidth,
            gapY: randomGapY(),
            gapHeight: GameConfig.pipeGap,
            scored: false,
          });
        }

        // Mover tuberías y detectar scoring
        const floorY = GameConfig.canvasHeight - GameConfig.floorHeight;
        for (const pipe of pipesRef.current) {
          pipe.x -= GameConfig.pipeSpeed * dt;
          if (!pipe.scored && pipe.x + pipe.width < bird.x) {
            pipe.scored = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
          }
        }

        // Eliminar tuberías fuera del canvas
        pipesRef.current = pipesRef.current.filter(
          (p) => p.x + p.width > -10
        );

        // Colisión con suelo
        if (bird.y + bird.radius >= floorY) {
          bird.y = floorY - bird.radius;
          triggerGameOver();
        }
        // Colisión con techo
        else if (bird.y - bird.radius <= 0) {
          bird.y = bird.radius;
          triggerGameOver();
        }
        // Colisión con tuberías (circle-rect)
        else {
          for (const pipe of pipesRef.current) {
            if (
              circleRectCollision(
                bird.x,
                bird.y,
                bird.radius,
                pipe.x,
                0,
                pipe.width,
                pipe.gapY - pipe.gapHeight / 2
              ) ||
              circleRectCollision(
                bird.x,
                bird.y,
                bird.radius,
                pipe.x,
                pipe.gapY + pipe.gapHeight / 2,
                pipe.width,
                floorY - (pipe.gapY + pipe.gapHeight / 2)
              )
            ) {
              triggerGameOver();
              break;
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    function triggerGameOver() {
      stateRef.current = "gameover";
      if (scoreRef.current > highScoreRef.current) {
        highScoreRef.current = scoreRef.current;
        saveHighScore(scoreRef.current);
        setHighScore(scoreRef.current);
        setIsNewBest(true);
      } else {
        setIsNewBest(false);
      }
      setState("gameover");
    }

    function circleRectCollision(
      cx: number,
      cy: number,
      cr: number,
      rx: number,
      ry: number,
      rw: number,
      rh: number
    ): boolean {
      if (rh <= 0) return false;
      const closestX = Math.max(rx, Math.min(cx, rx + rw));
      const closestY = Math.max(ry, Math.min(cy, ry + rh));
      const dx = cx - closestX;
      const dy = cy - closestY;
      return dx * dx + dy * dy < cr * cr;
    }

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Listener global de teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flap]);

  return {
    state,
    score,
    highScore,
    isNewBest,
    bird: birdRef.current,
    pipes: pipesRef.current,
    flap,
  };
}
