import type { Grid, Position } from "../grid/types";

/**
 * Every pathfinding algorithm is a generator that yields one step at a
 * time instead of returning a final answer. The UI just calls `.next()` on
 * a timer — the algorithm pauses after each node it visits, hands control
 * back to the animator, and resumes. That's the entire animation model
 * (PRD §5); nothing UI-specific leaks into this folder.
 */
export type AlgoStepType = "visit" | "path";

export interface AlgoStep {
  type: AlgoStepType;
  row: number;
  col: number;
}

export interface AlgoResult {
  visitedCount: number;
  /** null when no path exists — callers must handle this, not assume a path. */
  path: Position[] | null;
  /** Number of cells in the path (0 when path is null; 1 when start === end). */
  pathLength: number;
}

export type AlgoGenerator = Generator<AlgoStep, AlgoResult, void>;

export type AlgoFn = (grid: Grid, start: Position, end: Position) => AlgoGenerator;
