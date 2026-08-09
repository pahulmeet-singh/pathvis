import { useState } from "react";
import { useGridEditor, MIN_GRID_SIZE } from "@/hooks/useGridEditor";
import { useSolver } from "@/hooks/useSolver";
import { useMazeGenerator } from "@/hooks/useMazeGenerator";
import { GridCanvas } from "@/components/GridCanvas";
import { ControlPanel } from "@/components/ControlPanel";
import { StatsPanel } from "@/components/StatsPanel";
import { Legend } from "@/components/Legend";
import { getStart, getEnd, gridDimensions } from "@/lib/grid/gridUtils";
import type { Position } from "@/lib/grid/types";
import type { AlgorithmId } from "@/lib/algorithms";
import type { MazeAlgorithmId } from "@/lib/mazeGen";
import type { AnimationSpeed } from "@/lib/animationSpeed";

/**
 * App.tsx — top-level shell. Step 7 replaces the instant reveal from step
 * 6 with real animation: both "Visualize" and "Generate maze" now run
 * through requestAnimationFrame-paced engines (useSolver, useMazeGenerator)
 * instead of draining synchronously, and the grid locks against editing
 * for the duration of either.
 */
function App() {
  const { grid, setGrid, resize, handleCellMouseDown, handleCellMouseEnter } = useGridEditor();
  const { display, isRunning, solve, reset: resetSolve } = useSolver();
  const { isGenerating, generate } = useMazeGenerator(setGrid);
  const [algorithmId, setAlgorithmId] = useState<AlgorithmId>("bfs");
  const [mazeAlgorithmId, setMazeAlgorithmId] = useState<MazeAlgorithmId>("randomized-dfs");
  const [speed, setSpeed] = useState<AnimationSpeed>("fast");

  const { rows: gridSize } = gridDimensions(grid);
  const isBusy = isRunning || isGenerating;

  function handleGenerateMaze() {
    generate(mazeAlgorithmId, gridSize, gridSize, speed);
    resetSolve();
  }

  function handleVisualize() {
    solve(algorithmId, grid, getStart(grid), getEnd(grid), speed);
  }

  function handleAlgorithmChange(id: AlgorithmId) {
    setAlgorithmId(id);
    resetSolve();
  }

  function handleGridSizeChange(size: number) {
    resize(size, size);
    resetSolve();
  }

  function handleClearGrid() {
    resize(gridSize, gridSize);
    resetSolve();
  }

  // Any manual grid edit invalidates a displayed result — an old path
  // might now cross a wall that didn't exist when it was computed. Only
  // reachable when !isBusy anyway, since GridCanvas won't fire these while
  // disabled, but resetSolve() is a harmless no-op if there's nothing to
  // clear.
  function handleGridMouseDown(pos: Position, modifierHeld: boolean) {
    handleCellMouseDown(pos, modifierHeld);
    resetSolve();
  }
  function handleGridMouseEnter(pos: Position) {
    handleCellMouseEnter(pos);
    resetSolve();
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          PathVis
        </h1>
        <p className="text-sm text-slate-500">Pathfinding &amp; maze visualizer</p>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500">
              Click and drag to draw walls · drag the green or red marker to move start/end · hold{" "}
              <kbd className="rounded border border-slate-300 bg-white px-1 py-0.5 text-xs">Shift</kbd> and
              click to place mud
            </p>
            <GridCanvas
              grid={grid}
              disabled={isBusy}
              visited={display?.visited}
              path={display?.path}
              current={display?.current}
              onCellMouseDown={handleGridMouseDown}
              onCellMouseEnter={handleGridMouseEnter}
            />
            <Legend />
          </div>

          <div className="flex flex-col gap-4">
            <ControlPanel
              mazeAlgorithmId={mazeAlgorithmId}
              onMazeAlgorithmChange={setMazeAlgorithmId}
              onGenerateMaze={handleGenerateMaze}
              isGeneratingMaze={isGenerating}
              algorithmId={algorithmId}
              onAlgorithmChange={handleAlgorithmChange}
              onVisualize={handleVisualize}
              isVisualizing={isRunning}
              speed={speed}
              onSpeedChange={setSpeed}
              gridSize={gridSize || MIN_GRID_SIZE}
              onGridSizeChange={handleGridSizeChange}
              onResetRun={resetSolve}
              onClearGrid={handleClearGrid}
              disabled={isBusy}
            />
            <StatsPanel algorithmId={algorithmId} display={display} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
