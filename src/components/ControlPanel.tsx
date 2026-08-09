import { ALGORITHMS, type AlgorithmId } from "@/lib/algorithms";
import { MAZE_ALGORITHMS, type MazeAlgorithmId } from "@/lib/mazeGen";
import { MAX_GRID_SIZE, MIN_GRID_SIZE } from "@/hooks/useGridEditor";
import { ANIMATION_SPEEDS, SPEED_LABELS, type AnimationSpeed } from "@/lib/animationSpeed";

export interface ControlPanelProps {
  mazeAlgorithmId: MazeAlgorithmId;
  onMazeAlgorithmChange: (id: MazeAlgorithmId) => void;
  onGenerateMaze: () => void;
  isGeneratingMaze: boolean;

  algorithmId: AlgorithmId;
  onAlgorithmChange: (id: AlgorithmId) => void;
  onVisualize: () => void;
  isVisualizing: boolean;

  speed: AnimationSpeed;
  onSpeedChange: (speed: AnimationSpeed) => void;

  gridSize: number;
  onGridSizeChange: (size: number) => void;

  onResetRun: () => void;
  onClearGrid: () => void;

  /** True while either engine is animating — every control freezes
   * together (PRD UI/UX: no editing/re-triggering mid-animation). */
  disabled: boolean;
}

const selectClasses =
  "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
const primaryButtonClasses =
  "rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300";
const secondaryButtonClasses =
  "flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300";
const labelClasses = "text-xs font-semibold uppercase tracking-wide text-slate-400";

export function ControlPanel({
  mazeAlgorithmId,
  onMazeAlgorithmChange,
  onGenerateMaze,
  isGeneratingMaze,
  algorithmId,
  onAlgorithmChange,
  onVisualize,
  isVisualizing,
  speed,
  onSpeedChange,
  gridSize,
  onGridSizeChange,
  onResetRun,
  onClearGrid,
  disabled,
}: ControlPanelProps) {
  const selectedAlgo = ALGORITHMS[algorithmId];
  const speedIndex = ANIMATION_SPEEDS.indexOf(speed);

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-4">
      <section className="flex flex-col gap-2">
        <label className={labelClasses} htmlFor="maze-select">
          Maze
        </label>
        <select
          id="maze-select"
          value={mazeAlgorithmId}
          disabled={disabled}
          onChange={(e) => onMazeAlgorithmChange(e.target.value as MazeAlgorithmId)}
          className={selectClasses}
        >
          {Object.values(MAZE_ALGORITHMS).map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={onGenerateMaze} disabled={disabled} className={primaryButtonClasses}>
          {isGeneratingMaze ? "Generating…" : "Generate maze"}
        </button>
      </section>

      <section className="flex flex-col gap-2 border-t border-slate-100 pt-4">
        <label className={labelClasses} htmlFor="algo-select">
          Algorithm
        </label>
        <select
          id="algo-select"
          value={algorithmId}
          disabled={disabled}
          onChange={(e) => onAlgorithmChange(e.target.value as AlgorithmId)}
          className={selectClasses}
        >
          {Object.values(ALGORITHMS).map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500">{selectedAlgo.shortDescription}</p>
        <button
          type="button"
          onClick={onVisualize}
          disabled={disabled}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {isVisualizing ? "Visualizing…" : "Visualize"}
        </button>
      </section>

      <section className="flex flex-col gap-2 border-t border-slate-100 pt-4">
        <label className="flex items-center justify-between" htmlFor="speed-slider">
          <span className={labelClasses}>Animation speed</span>
          <span className="text-xs text-slate-500">{SPEED_LABELS[speed]}</span>
        </label>
        <input
          id="speed-slider"
          type="range"
          min={0}
          max={ANIMATION_SPEEDS.length - 1}
          step={1}
          value={speedIndex}
          disabled={disabled}
          onChange={(e) => onSpeedChange(ANIMATION_SPEEDS[Number(e.target.value)])}
        />
      </section>

      <section className="flex flex-col gap-2 border-t border-slate-100 pt-4">
        <label className="flex items-center justify-between" htmlFor="size-slider">
          <span className={labelClasses}>Grid size</span>
          <span className="text-xs text-slate-500">
            {gridSize}×{gridSize}
          </span>
        </label>
        <input
          id="size-slider"
          type="range"
          min={MIN_GRID_SIZE}
          max={MAX_GRID_SIZE}
          step={1}
          value={gridSize}
          disabled={disabled}
          onChange={(e) => onGridSizeChange(Number(e.target.value))}
        />
      </section>

      <section className="flex gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onResetRun} disabled={disabled} className={secondaryButtonClasses}>
          Reset
        </button>
        <button type="button" onClick={onClearGrid} disabled={disabled} className={secondaryButtonClasses}>
          Clear grid
        </button>
      </section>
    </div>
  );
}
