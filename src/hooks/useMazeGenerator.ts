import { useCallback, useRef, useState } from "react";
import type { Grid, Position } from "@/lib/grid/types";
import type { MazeAlgorithmId } from "@/lib/mazeGen";
import { MAZE_ALGORITHMS, createWallGrid, generateMazeInstantly, placeStartAndEnd } from "@/lib/mazeGen";
import type { AnimationSpeed } from "@/lib/animationSpeed";
import { SPEED_STEP_DELAY_MS } from "@/lib/animationSpeed";

export interface UseMazeGeneratorResult {
  isGenerating: boolean;
  generate: (mazeAlgorithmId: MazeAlgorithmId, rows: number, cols: number, speed: AnimationSpeed) => void;
}

/**
 * Same accumulator/requestAnimationFrame pacing model as useSolver, but
 * maze generation has a different shape: there's no separate "overlay" —
 * the thing being progressively revealed *is* the Grid itself (walls
 * turning to empty as carving proceeds), which lives in useGridEditor, not
 * here. This hook takes that hook's `setGrid` and drives it directly.
 *
 * Each carved position from the generator is applied to a private working
 * copy once per animation frame (batched — not re-cloning the grid on
 * every single yield, which matters once several yields land in one
 * frame at faster speeds) and pushed into React state via `setGrid`.
 */
export function useMazeGenerator(setGrid: (grid: Grid) => void): UseMazeGeneratorResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const runIdRef = useRef(0);

  const generate = useCallback(
    (mazeAlgorithmId: MazeAlgorithmId, rows: number, cols: number, speed: AnimationSpeed) => {
      const myRunId = ++runIdRef.current;
      const mazeAlgo = MAZE_ALGORITHMS[mazeAlgorithmId];
      const delay = SPEED_STEP_DELAY_MS[speed];

      if (delay === 0) {
        setGrid(generateMazeInstantly(mazeAlgo, rows, cols));
        setIsGenerating(false);
        return;
      }

      const gen = mazeAlgo.run(rows, cols);
      let workingGrid = createWallGrid(rows, cols);
      setGrid(workingGrid);
      setIsGenerating(true);

      let lastFrameTime = performance.now();
      let accumulated = 0;

      function applyCarves(positions: Position[]) {
        const next = workingGrid.map((row) => row.slice());
        for (const p of positions) {
          next[p.row][p.col] = { ...next[p.row][p.col], type: "empty" };
        }
        workingGrid = next;
        setGrid(workingGrid);
      }

      function tick(now: number) {
        if (runIdRef.current !== myRunId) return; // superseded by a newer run or a reset

        accumulated += now - lastFrameTime;
        lastFrameTime = now;

        const newlyCarved: Position[] = [];
        while (accumulated >= delay) {
          accumulated -= delay;
          const step = gen.next();
          if (step.done) {
            if (newlyCarved.length > 0) applyCarves(newlyCarved);
            setGrid(placeStartAndEnd(step.value));
            setIsGenerating(false);
            return;
          }
          newlyCarved.push(step.value);
        }

        if (newlyCarved.length > 0) applyCarves(newlyCarved);
        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    },
    [setGrid],
  );

  return { isGenerating, generate };
}
