export const GameConfig = {
  canvasWidth: 400,
  canvasHeight: 600,
  birdX: 100,
  birdRadius: 12,
  gravity: 0.5,
  flapStrength: -8,
  maxFallSpeed: 10,
  pipeWidth: 60,
  pipeGap: 150,
  pipeSpacing: 220,
  pipeSpeed: 2.5,
  floorHeight: 80,
} as const;

export const HIGH_SCORE_KEY = "flappy-highscore";
