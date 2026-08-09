import { useCallback, useRef, useState } from "react";
import type { AlgorithmId, AlgoResult } from "@/lib/algorithms";
import { ALGORITHMS, runAlgorithmInstantly } from "@/lib/algorithms";
import type { Grid, Position } from "@/lib/grid/types";
import type { AnimationSpeed } from "@/lib/animationSpeed";
import { SPEED_STEP_DELAY_MS } from "@/lib/animationSpeed";

export interface SolveStats {
  visitedCount: number;
  pathLength: number;
  pathFound: boolean;
  executionTimeMs: number;
}

export interface SolveDisplay {
  algorithmId: AlgorithmId;
  visited: Position[];
  /** The single most-recently-processed cell — the "frontier / currently
   * checking" highlight (PRD §10). null once a run finishes or is reset. */
  current: Position | null;
  path: Position[];
  stats: SolveStats;
}

export interface UseSolverResult {
  display: SolveDisplay | null;
  isRunning: boolean;
  solve: (algorithmId: AlgorithmId, grid: Grid, start: Position, end: Position, speed: AnimationSpeed) => void;
  reset: () => void;
}

/**
 * The animation engine for pathfinding runs. `solve` at "instant" speed
 * drains the algorithm synchronously (reusing `runAlgorithmInstantly`
 * directly — same code path step 6 used). At any other speed it steps the
 * *same* generator via requestAnimationFrame, consuming as many yields as
 * the elapsed real time affords each frame (an accumulator, not a fixed
 * "one step per frame") so the total animation length stays consistent
 * even if a frame runs long — e.g. a backgrounded tab regaining focus
 * doesn't cause a burst that breaks the pacing.
 *
 * `runIdRef` guards against stale timers: starting a new run, or calling
 * `reset`, invalidates any in-flight animation's frame callback so it
 * silently stops instead of racing with newer state.
 */
export function useSolver(): UseSolverResult {
  const [display, setDisplay] = useState<SolveDisplay | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const runIdRef = useRef(0);

  const reset = useCallback(() => {
    runIdRef.current += 1;
    setIsRunning(false);
    setDisplay(null);
  }, []);

  const solve = useCallback(
    (algorithmId: AlgorithmId, grid: Grid, start: Position, end: Position, speed: AnimationSpeed) => {
      const myRunId = ++runIdRef.current;
      const algo = ALGORITHMS[algorithmId];
      const delay = SPEED_STEP_DELAY_MS[speed];

      if (delay === 0) {
        const run = runAlgorithmInstantly(algo, grid, start, end);
        setDisplay({
          algorithmId,
          visited: run.visited,
          current: null,
          path: run.path,
          stats: {
            visitedCount: run.visitedCount,
            pathLength: run.pathLength,
            pathFound: run.pathFound,
            executionTimeMs: run.executionTimeMs,
          },
        });
        setIsRunning(false);
        return;
      }

      const gen = algo.run(grid, start, end);
      const visited: Position[] = [];
      const path: Position[] = [];
      const t0 = performance.now();
      let lastFrameTime = t0;
      let accumulated = 0;

      setIsRunning(true);
      setDisplay({
        algorithmId,
        visited: [],
        current: null,
        path: [],
        stats: { visitedCount: 0, pathLength: 0, pathFound: false, executionTimeMs: 0 },
      });

      function finish(result: AlgoResult) {
        setDisplay({
          algorithmId,
          visited: visited.slice(),
          current: null,
          path: path.slice(),
          stats: {
            visitedCount: result.visitedCount,
            pathLength: result.pathLength,
            pathFound: result.path !== null,
            executionTimeMs: performance.now() - t0,
          },
        });
        setIsRunning(false);
      }

      function tick(now: number) {
        if (runIdRef.current !== myRunId) return; // superseded by a newer run or a reset

        accumulated += now - lastFrameTime;
        lastFrameTime = now;

        let current: Position | null = null;
        while (accumulated >= delay) {
          accumulated -= delay;
          const step = gen.next();
          if (step.done) {
            finish(step.value);
            return;
          }
          current = { row: step.value.row, col: step.value.col };
          if (step.value.type === "visit") visited.push(current);
          else path.push(current);
        }

        setDisplay({
          algorithmId,
          visited: visited.slice(),
          current,
          path: path.slice(),
          stats: {
            visitedCount: visited.length,
            pathLength: path.length,
            pathFound: false,
            executionTimeMs: now - t0,
          },
        });

        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    },
    [],
  );

  return { display, isRunning, solve, reset };
}
