import { useState } from "react";
import { useGridEditor, MIN_GRID_SIZE } from "@/hooks/useGridEditor";
import { useSolver } from "@/hooks/useSolver";
import { useMazeGenerator } from "@/hooks/useMazeGenerator";
import { GridInstrument } from "@/components/GridInstrument";
import { ComparisonView } from "@/components/ComparisonView";
import { ControlPanel } from "@/components/ControlPanel";
import { StatsPanel } from "@/components/StatsPanel";
import { ComparisonStatsPanel } from "@/components/ComparisonStatsPanel";
import { Legend } from "@/components/Legend";
import { HowItWorks } from "@/components/HowItWorks";
import { getStart, getEnd, gridDimensions } from "@/lib/grid/gridUtils";
import type { Position } from "@/lib/grid/types";
import type { AlgorithmId } from "@/lib/algorithms";
import type { MazeAlgorithmId } from "@/lib/mazeGen";
import type { AnimationSpeed } from "@/lib/animationSpeed";

/**
 * App.tsx — top-level shell. Step 9 restyles the whole page chrome to the
 * "Drafting Console" design system (see PROGRESS.md for the brainstorm)
 * and adds the "How it works" panel owed since PRD §10. No functional
 * changes in this step — every wire from step 8 is unchanged, only the
 * classNames and two new visual components (GridInstrument, HowItWorks).
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

  function handleGridMouseDown(pos: Position, modifierHeld: boolean) {
    handleCellMouseDown(pos, modifierHeld);
    resetRun();
  }
  function handleGridMouseEnter(pos: Position) {
    handleCellMouseEnter(pos);
    resetRun();
  }

  return (
    <div className="min-h-screen bg-console font-body text-console-ink">
      <header className="border-b border-console-border bg-console-panel px-6 py-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-console-ink">PathVis</h1>
        <p className="font-mono text-xs text-console-ink-muted">Pathfinding &amp; maze visualizer</p>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-console-ink-muted">
              Click and drag to draw walls · drag the green or red marker to move start/end · hold{" "}
              <kbd className="rounded border border-console-border bg-console px-1 py-0.5 font-mono text-xs text-console-ink">
                Shift
              </kbd>{" "}
              and click to place mud
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
              <GridInstrument
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
            <HowItWorks />
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
