import { useState } from "react";
import { useGridEditor, MIN_GRID_SIZE } from "@/hooks/useGridEditor";
import { useSolver } from "@/hooks/useSolver";
import { useMazeGenerator } from "@/hooks/useMazeGenerator";
import { GridCanvas } from "@/components/GridCanvas";
import { ComparisonView } from "@/components/ComparisonView";
import { ControlPanel } from "@/components/ControlPanel";
import { StatsPanel } from "@/components/StatsPanel";
import { ComparisonStatsPanel } from "@/components/ComparisonStatsPanel";
import { Legend } from "@/components/Legend";
import { getStart, getEnd, gridDimensions } from "@/lib/grid/gridUtils";
import type { Position } from "@/lib/grid/types";
import type { AlgorithmId } from "@/lib/algorithms";
import type { MazeAlgorithmId } from "@/lib/mazeGen";
import type { AnimationSpeed } from "@/lib/animationSpeed";

/**
 * App.tsx — top-level shell. Step 8 adds comparison mode: a second,
 * independent `useSolver` instance (solverB) that only gets triggered
 * when comparisonMode is on. Both solves are kicked off in the same
 * synchronous handler with the same speed — per ComparisonView's doc
 * comment, that's sufficient for them to stay frame-synced without any
 * shared-clock machinery, since same-frame requestAnimationFrame calls
 * share a timestamp.
 */
function App() {
  const { grid, setGrid, resize, handleCellMouseDown, handleCellMouseEnter } = useGridEditor();
  const solverA = useSolver();
  const solverB = useSolver();
  const { isGenerating, generate } = useMazeGenerator(setGrid);

  const [algorithmId, setAlgorithmId] = useState<AlgorithmId>("bfs");
  const [algorithmIdB, setAlgorithmIdB] = useState<AlgorithmId>("astar");
  const [mazeAlgorithmId, setMazeAlgorithmId] = useState<MazeAlgorithmId>("randomized-dfs");
  const [speed, setSpeed] = useState<AnimationSpeed>("fast");
  const [comparisonMode, setComparisonMode] = useState(false);

  const { rows: gridSize } = gridDimensions(grid);
  const isBusy = isGenerating || solverA.isRunning || solverB.isRunning;

  function resetRun() {
    solverA.reset();
    solverB.reset();
  }

  function handleGenerateMaze() {
    generate(mazeAlgorithmId, gridSize, gridSize, speed);
    resetRun();
  }

  function handleRun() {
    const start = getStart(grid);
    const end = getEnd(grid);
    solverA.solve(algorithmId, grid, start, end, speed);
    if (comparisonMode) {
      solverB.solve(algorithmIdB, grid, start, end, speed);
    }
  }

  function handleComparisonModeChange(enabled: boolean) {
    setComparisonMode(enabled);
    resetRun();
  }

  function handleAlgorithmChange(id: AlgorithmId) {
    setAlgorithmId(id);
    resetRun();
  }

  function handleAlgorithmBChange(id: AlgorithmId) {
    setAlgorithmIdB(id);
    resetRun();
  }

  function handleGridSizeChange(size: number) {
    resize(size, size);
    resetRun();
  }

  function handleClearGrid() {
    resize(gridSize, gridSize);
    resetRun();
  }

  // Any manual grid edit invalidates a displayed result — an old path
  // might now cross a wall that didn't exist when it was computed. Only
  // reachable when !isBusy anyway, since GridCanvas won't fire these while
  // disabled, but resetRun() is a harmless no-op if there's nothing to
  // clear.
  function handleGridMouseDown(pos: Position, modifierHeld: boolean) {
    handleCellMouseDown(pos, modifierHeld);
    resetRun();
  }
  function handleGridMouseEnter(pos: Position) {
    handleCellMouseEnter(pos);
    resetRun();
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

            {comparisonMode ? (
              <ComparisonView
                grid={grid}
                disabled={isBusy}
                algorithmIdA={algorithmId}
                displayA={solverA.display}
                algorithmIdB={algorithmIdB}
                displayB={solverB.display}
                onCellMouseDown={handleGridMouseDown}
                onCellMouseEnter={handleGridMouseEnter}
              />
            ) : (
              <GridCanvas
                grid={grid}
                disabled={isBusy}
                visited={solverA.display?.visited}
                path={solverA.display?.path}
                current={solverA.display?.current}
                onCellMouseDown={handleGridMouseDown}
                onCellMouseEnter={handleGridMouseEnter}
              />
            )}

            <Legend />
          </div>

          <div className="flex flex-col gap-4">
            <ControlPanel
              mazeAlgorithmId={mazeAlgorithmId}
              onMazeAlgorithmChange={setMazeAlgorithmId}
              onGenerateMaze={handleGenerateMaze}
              isGeneratingMaze={isGenerating}
              comparisonMode={comparisonMode}
              onComparisonModeChange={handleComparisonModeChange}
              algorithmId={algorithmId}
              onAlgorithmChange={handleAlgorithmChange}
              algorithmIdB={algorithmIdB}
              onAlgorithmBChange={handleAlgorithmBChange}
              onRun={handleRun}
              isRunning={solverA.isRunning || solverB.isRunning}
              speed={speed}
              onSpeedChange={setSpeed}
              gridSize={gridSize || MIN_GRID_SIZE}
              onGridSizeChange={handleGridSizeChange}
              onResetRun={resetRun}
              onClearGrid={handleClearGrid}
              disabled={isBusy}
            />

            {comparisonMode ? (
              <ComparisonStatsPanel
                algorithmIdA={algorithmId}
                displayA={solverA.display}
                algorithmIdB={algorithmIdB}
                displayB={solverB.display}
              />
            ) : (
              <StatsPanel algorithmId={algorithmId} display={solverA.display} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
