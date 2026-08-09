import type { AlgorithmId } from "@/lib/algorithms";
import { ALGORITHMS } from "@/lib/algorithms";
import type { Grid, Position } from "@/lib/grid/types";
import type { SolveDisplay } from "@/hooks/useSolver";
import { GridInstrument } from "./GridInstrument";

export interface ComparisonViewProps {
  grid: Grid;
  disabled: boolean;
  algorithmIdA: AlgorithmId;
  displayA: SolveDisplay | null;
  algorithmIdB: AlgorithmId;
  displayB: SolveDisplay | null;
  onCellMouseDown: (pos: Position, modifierHeld: boolean) => void;
  onCellMouseEnter: (pos: Position) => void;
}

/**
 * Two GridInstrument (bezeled GridCanvas) instances on the *same* grid
 * (PRD §3: "run 2 algorithms simultaneously on identical grids"). Editing
 * either one edits the one shared grid both are reading from — there's no
 * separate "grid A" and "grid B" to keep in sync, only two independent
 * overlays on the same underlying data.
 *
 * Sync comes from how the two `useSolver` instances are driven, not from
 * anything in this component: App.tsx starts both `solve()` calls in the
 * same synchronous handler, with the same `speed`, so their first
 * `requestAnimationFrame` requests land in the same browser frame and
 * every subsequent frame after that — rAF callbacks queued within one
 * frame share that frame's timestamp, so the two accumulator loops
 * consume identical elapsed time on every tick. This component just
 * renders whatever each one currently has.
 */
export function ComparisonView({
  grid,
  disabled,
  algorithmIdA,
  displayA,
  algorithmIdB,
  displayB,
  onCellMouseDown,
  onCellMouseEnter,
}: ComparisonViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <GridInstrument
        label={ALGORITHMS[algorithmIdA].label}
        grid={grid}
        disabled={disabled}
        visited={displayA?.visited}
        path={displayA?.path}
        current={displayA?.current}
        onCellMouseDown={onCellMouseDown}
        onCellMouseEnter={onCellMouseEnter}
      />
      <GridInstrument
        label={ALGORITHMS[algorithmIdB].label}
        grid={grid}
        disabled={disabled}
        visited={displayB?.visited}
        path={displayB?.path}
        current={displayB?.current}
        onCellMouseDown={onCellMouseDown}
        onCellMouseEnter={onCellMouseEnter}
      />
    </div>
  );
}
