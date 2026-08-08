import type { Grid, Position } from "../grid/types";
import { randomizedDFS } from "./randomizedDFS";
import { randomizedPrims } from "./randomizedPrims";

export { findNearestEmpty, getRoomNeighbors, placeStartAndEnd, wallBetween } from "./mazeUtils";
export { randomizedDFS } from "./randomizedDFS";
export { randomizedPrims } from "./randomizedPrims";
export { generateMazeInstantly } from "./generateInstantly";

export type MazeGenerator = Generator<Position, Grid, void>;
export type MazeAlgorithmId = "randomized-dfs" | "randomized-prims";

export interface MazeAlgorithmDef {
  id: MazeAlgorithmId;
  label: string;
  run: (rows: number, cols: number) => MazeGenerator;
}

/** Registry the UI's maze dropdown (FR1) reads from directly, so adding a
 * third maze algorithm later never means touching component code. */
export const MAZE_ALGORITHMS: Record<MazeAlgorithmId, MazeAlgorithmDef> = {
  "randomized-dfs": {
    id: "randomized-dfs",
    label: "Randomized DFS (Recursive Backtracker)",
    run: randomizedDFS,
  },
  "randomized-prims": {
    id: "randomized-prims",
    label: "Randomized Prim's",
    run: randomizedPrims,
  },
};
