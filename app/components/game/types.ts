export type GameState = "idle" | "playing" | "gameover";

export interface Bird {
  x: number;
  y: number;
  velocity: number;
  radius: number;
  rotation: number;
  frame: number;
}

export interface Pipe {
  id: number;
  x: number;
  width: number;
  gapY: number;
  gapHeight: number;
  scored: boolean;
}
