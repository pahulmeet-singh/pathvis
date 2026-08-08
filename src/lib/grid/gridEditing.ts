import type { CellType, Grid, Position } from "./types";
import { moveAnchor, setCellType } from "./gridUtils";

export type DragMode =
  | { kind: "wall" }
  | { kind: "erase" }
  | { kind: "mud" }
  | { kind: "anchor"; which: "start" | "end" };

export interface MouseDownResult {
  grid: Grid;
  dragMode: DragMode;
}

/**
 * Pure decision logic for "what does pressing the mouse down on this cell
 * mean" (FR2-FR4): grab an anchor, toggle mud, or start a wall-draw/erase
 * drag. Kept free of React and the DOM on purpose — this is the part of
 * "grid interactions" (step 5) most worth being able to verify without a
 * browser, and `useGridEditor` is just a thin wrapper around it.
 */
export function applyMouseDown(grid: Grid, pos: Position, modifierHeld: boolean): MouseDownResult {
  const cell = grid[pos.row][pos.col];

  if (cell.type === "start") return { grid, dragMode: { kind: "anchor", which: "start" } };
  if (cell.type === "end") return { grid, dragMode: { kind: "anchor", which: "end" } };

  if (modifierHeld) {
    const nextType: CellType = cell.type === "mud" ? "empty" : "mud";
    return { grid: setCellType(grid, pos, nextType), dragMode: { kind: "mud" } };
  }

  if (cell.type === "wall") {
    return { grid: setCellType(grid, pos, "empty"), dragMode: { kind: "erase" } };
  }

  return { grid: setCellType(grid, pos, "wall"), dragMode: { kind: "wall" } };
}

/**
 * Pure decision logic for dragging into a new cell mid-drag, given the
 * mode `applyMouseDown` already established for this drag.
 */
export function applyMouseEnter(grid: Grid, pos: Position, dragMode: DragMode): Grid {
  switch (dragMode.kind) {
    case "wall":
      return setCellType(grid, pos, "wall");
    case "erase":
      return setCellType(grid, pos, "empty");
    case "mud":
      return setCellType(grid, pos, "mud");
    case "anchor":
      return moveAnchor(grid, dragMode.which, pos);
  }
}
