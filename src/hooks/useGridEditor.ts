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
  clearWalls: () => void;
  locked: boolean;
  setLocked: (locked: boolean) => void;
  handleCellMouseDown: (pos: Position, modifierHeld: boolean) => void;
  handleCellMouseEnter: (pos: Position) => void;
}

/**
 * Owns the editable Grid and wires DOM-level mouse events (from
 * GridCanvas) to the pure interaction rules in lib/grid/gridEditing.ts.
 * `locked` is exposed for the animation engine (step 7) to set while a
 * run is in progress, per the PRD's requirement that editing is disabled
 * mid-animation.
 */
export function useGridEditor(
  initialRows: number = DEFAULT_GRID_ROWS,
  initialCols: number = DEFAULT_GRID_COLS,
): UseGridEditorResult {
  const [grid, setGrid] = useState<Grid>(() => createEmptyGrid(initialRows, initialCols));
  const [locked, setLocked] = useState(false);
  const dragModeRef = useRef<DragMode | null>(null);

  const resize = useCallback((rows: number, cols: number) => {
    setGrid(createEmptyGrid(rows, cols));
  }, []);

  const clearWalls = useCallback(() => {
    setGrid((g) =>
      g.map((row) =>
        row.map((cell) =>
          cell.type === "wall" || cell.type === "mud" ? { ...cell, type: "empty", weight: 1 } : cell,
        ),
      ),
    );
  }, []);

  // Not using the functional setGrid(g => ...) form here on purpose: this
  // handler also needs to set dragModeRef as a side effect exactly once
  // per real mousedown, and React (StrictMode) can invoke updater
  // functions twice — fine for pure state updates, not fine for a ref
  // mutation riding along inside one. Reading `grid` from the closure and
  // depending on it in useCallback keeps this side-effect-safe.
  const handleCellMouseDown = useCallback(
    (pos: Position, modifierHeld: boolean) => {
      if (locked) return;
      const result = applyMouseDown(grid, pos, modifierHeld);
      dragModeRef.current = result.dragMode;
      setGrid(result.grid);
    },
    [grid, locked],
  );

  // applyMouseEnter IS pure, so the functional updater form is safe here
  // and means this callback never goes stale mid-drag regardless of
  // render timing.
  const handleCellMouseEnter = useCallback(
    (pos: Position) => {
      const mode = dragModeRef.current;
      if (!mode || locked) return;
      setGrid((g) => applyMouseEnter(g, pos, mode));
    },
    [locked],
  );

  useEffect(() => {
    const handleWindowMouseUp = () => {
      dragModeRef.current = null;
    };
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => window.removeEventListener("mouseup", handleWindowMouseUp);
  }, []);

  return { grid, setGrid, resize, clearWalls, locked, setLocked, handleCellMouseDown, handleCellMouseEnter };
}
