import type { Grid, Position } from "../grid/types";
import type { AlgorithmDef } from "./index";

export interface InstantRun {
  visited: Position[];
  path: Position[];
  visitedCount: number;
  pathLength: number;
  pathFound: boolean;
  /** Time spent actually draining the generator, in milliseconds — this is
   * real algorithmic compute time, not wall-clock including any UI delay.
   * The animation engine (step 7) adds artificial per-step delay for
   * visualization; that delay is never part of this measurement, on
   * purpose, so the stats panel's "execution time" stays meaningful
   * regardless of animation speed. */
  executionTimeMs: number;
}

/**
 * Runs an algorithm to completion in one synchronous pass, collecting
 * every yielded step instead of discarding them. This is what step 6's
 * "Visualize" button uses to show a full result immediately; step 7 adds
 * a *progressive* version that reveals the same yields over time via
 * `.next()` on a timer rather than draining in a loop — the algorithm
 * code itself doesn't change at all between the two.
 */
export function runAlgorithmInstantly(
  algo: AlgorithmDef,
  grid: Grid,
  start: Position,
  end: Position,
): InstantRun {
  const gen = algo.run(grid, start, end);
  const visited: Position[] = [];
  const path: Position[] = [];

  const t0 = performance.now();
  let step = gen.next();
  while (!step.done) {
    if (step.value.type === "visit") {
      visited.push({ row: step.value.row, col: step.value.col });
    } else {
      path.push({ row: step.value.row, col: step.value.col });
    }
    step = gen.next();
  }
  const executionTimeMs = performance.now() - t0;

  const result = step.value;
  return {
    visited,
    path,
    visitedCount: result.visitedCount,
    pathLength: result.pathLength,
    pathFound: result.path !== null,
    executionTimeMs,
  };
}
