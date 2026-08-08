import type { Grid } from "../grid/types";
import type { MazeAlgorithmDef } from "./index";
import { placeStartAndEnd } from "./mazeUtils";

/**
 * Runs a maze generator to completion in one synchronous pass and places
 * start/end on the result. This is what step 6's "Generate maze" button
 * uses; step 7 adds a progressive version that reveals the same carve
 * sequence over time instead of all at once — the maze algorithms
 * themselves don't change between the two, only how their yields are
 * consumed.
 */
export function generateMazeInstantly(mazeAlgo: MazeAlgorithmDef, rows: number, cols: number): Grid {
  const gen = mazeAlgo.run(rows, cols);
  let step = gen.next();
  while (!step.done) step = gen.next();
  return placeStartAndEnd(step.value);
}
