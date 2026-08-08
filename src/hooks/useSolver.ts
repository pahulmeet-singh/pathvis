import { useCallback, useState } from "react";
import type { AlgorithmId } from "@/lib/algorithms";
import { ALGORITHMS, runAlgorithmInstantly } from "@/lib/algorithms";
import type { Grid, Position } from "@/lib/grid/types";

export interface SolveStats {
  visitedCount: number;
  pathLength: number;
  pathFound: boolean;
  executionTimeMs: number;
}

export interface SolveDisplay {
  algorithmId: AlgorithmId;
  visited: Position[];
  path: Position[];
  stats: SolveStats;
}

export interface UseSolverResult {
  display: SolveDisplay | null;
  solve: (algorithmId: AlgorithmId, grid: Grid, start: Position, end: Position) => void;
  reset: () => void;
}

/**
 * Owns the current run's result for display. `solve` is synchronous today
 * (step 6: instant full-result reveal) — step 7 replaces the *inside* of
 * `solve` with a timer-driven `.next()` loop that updates `display`
 * progressively instead of once, but this hook's public shape (a
 * `display` the UI renders, a `solve` function that kicks off a run, a
 * `reset`) doesn't need to change to support that.
 */
export function useSolver(): UseSolverResult {
  const [display, setDisplay] = useState<SolveDisplay | null>(null);

  const solve = useCallback((algorithmId: AlgorithmId, grid: Grid, start: Position, end: Position) => {
    const algo = ALGORITHMS[algorithmId];
    const run = runAlgorithmInstantly(algo, grid, start, end);
    setDisplay({
      algorithmId,
      visited: run.visited,
      path: run.path,
      stats: {
        visitedCount: run.visitedCount,
        pathLength: run.pathLength,
        pathFound: run.pathFound,
        executionTimeMs: run.executionTimeMs,
      },
    });
  }, []);

  const reset = useCallback(() => setDisplay(null), []);

  return { display, solve, reset };
}
