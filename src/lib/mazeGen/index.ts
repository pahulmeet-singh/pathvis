import type { Grid, Position } from "../grid/types";
import { randomizedDFS } from "./randomizedDFS";
import { randomizedPrims } from "./randomizedPrims";

export { createWallGrid, findNearestEmpty, getRoomNeighbors, placeStartAndEnd, wallBetween } from "./mazeUtils";
export { randomizedDFS } from "./randomizedDFS";
export { randomizedPrims } from "./randomizedPrims";
export { generateMazeInstantly } from "./generateInstantly";

export type MazeGenerator = Generator<Position, Grid, void>;
export type MazeAlgorithmId = "randomized-dfs" | "randomized-prims";

export interface MazeAlgorithmDef {
  id: MazeAlgorithmId;
  label: string;
  /** 2-3 sentence explanation for the in-app "How it works" panel (PRD
   * §10) — also doubles as the viva cheat sheet content (step 11). */
  howItWorks: string;
  run: (rows: number, cols: number) => MazeGenerator;
}

/** Registry the UI's maze dropdown (FR1) reads from directly, so adding a
 * third maze algorithm later never means touching component code. */
export const MAZE_ALGORITHMS: Record<MazeAlgorithmId, MazeAlgorithmDef> = {
  "randomized-dfs": {
    id: "randomized-dfs",
    label: "Randomized DFS (Recursive Backtracker)",
    howItWorks:
      "Carves a maze by picking a random unvisited neighboring room, tunneling to it, and repeating — backtracking only when it runs into a dead end. Because every room is reached by tunneling from an already-connected room, the result is guaranteed to be fully connected with exactly one path between any two points.",
    run: randomizedDFS,
  },
  "randomized-prims": {
    id: "randomized-prims",
    label: "Randomized Prim's",
    howItWorks:
      "Grows the maze outward from a single room: at each step, it picks a random room from the growing \"frontier\" — not necessarily the most recently carved one — and connects it in. That difference (frontier-wide choice instead of always extending the latest tunnel) is why Prim's mazes look more branching and Recursive Backtracker's look more like long winding corridors.",
    run: randomizedPrims,
  },
};
