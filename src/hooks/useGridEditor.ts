import { useCallback, useEffect, useRef, useState } from "react";
import type { Grid, Position } from "@/lib/grid/types";
import { createEmptyGrid } from "@/lib/grid/gridUtils";
import { applyMouseDown, applyMouseEnter, type DragMode } from "@/lib/grid/gridEditing";

export const DEFAULT_GRID_ROWS = 25;
export const DEFAULT_GRID_COLS = 25;
export const MIN_GRID_SIZE = 15;
export const MAX_GRID_SIZE = 40;

export interface UseGridEditorResult {
  grid: Grid;
  setGrid: (grid: Grid) => void;
  resize: (rows: number, cols: number) => void;
  handleCellMouseDown: (pos: Position, modifierHeld: boolean) => void;
  handleCellMouseEnter: (pos: Position) => void;
}

/**
 * Owns the editable Grid and wires DOM-level mouse events (from
 * GridCanvas) to the pure interaction rules in lib/grid/gridEditing.ts.
 *
 * No `locked` flag lives here (step 5/6 had one; removed in step 7). Once
 * two separate animation engines (useSolver, useMazeGenerator) both need
 * to be able to lock editing, having *this* hook also own an independent
 * lock flag means keeping three booleans in sync by hand — a real way to
 * introduce a bug where the canvas looks disabled but a handler still
 * fires, or vice versa. Simpler and equally correct: GridCanvas already
 * refuses to invoke these handlers at all when its own `disabled` prop is
 * true, and App.tsx computes that prop as `isRunning || isGenerating`
 * directly from the two engines. One source of truth, enforced at the one
 * place these handlers can actually be triggered from.
 */
export function useGridEditor(
  initialRows: number = DEFAULT_GRID_ROWS,
  initialCols: number = DEFAULT_GRID_COLS,
): UseGridEditorResult {
  const [grid, setGrid] = useState<Grid>(() => createEmptyGrid(initialRows, initialCols));
  const dragModeRef = useRef<DragMode | null>(null);

  const resize = useCallback((rows: number, cols: number) => {
    setGrid(createEmptyGrid(rows, cols));
  }, []);

  // Not using the functional setGrid(g => ...) form here on purpose: this
  // handler also needs to set dragModeRef as a side effect exactly once
  // per real mousedown, and React (StrictMode) can invoke updater
  // functions twice — fine for pure state updates, not fine for a ref
  // mutation riding along inside one. Reading `grid` from the closure and
  // depending on it in useCallback keeps this side-effect-safe.
  const handleCellMouseDown = useCallback(
    (pos: Position, modifierHeld: boolean) => {
      const result = applyMouseDown(grid, pos, modifierHeld);
      dragModeRef.current = result.dragMode;
      setGrid(result.grid);
    },
    [grid],
  );

  // applyMouseEnter IS pure, so the functional updater form is safe here
  // and means this callback never goes stale mid-drag regardless of
  // render timing.
  const handleCellMouseEnter = useCallback((pos: Position) => {
    const mode = dragModeRef.current;
    if (!mode) return;
    setGrid((g) => applyMouseEnter(g, pos, mode));
  }, []);

  useEffect(() => {
    const handleWindowMouseUp = () => {
      dragModeRef.current = null;
    };
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => window.removeEventListener("mouseup", handleWindowMouseUp);
  }, []);

  return { grid, setGrid, resize, handleCellMouseDown, handleCellMouseEnter };
}
