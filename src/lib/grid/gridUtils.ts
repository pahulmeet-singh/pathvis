import type { CellType, Grid, GridDimensions, GridNode, Position } from "./types";
import { MUD_WEIGHT } from "./types";

export function posKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

export function gridDimensions(grid: Grid): GridDimensions {
  return { rows: grid.length, cols: grid[0]?.length ?? 0 };
}

export function isWithinBounds(dims: GridDimensions, row: number, col: number): boolean {
  return row >= 0 && row < dims.rows && col >= 0 && col < dims.cols;
}

/**
 * Sensible default start/end placement for a fresh grid: same row, roughly
 * a fifth of the way in from each side. Falls back to the two ends of the
 * row for very narrow grids so start and end never collide.
 */
export function defaultStartEnd(rows: number, cols: number): { start: Position; end: Position } {
  const row = Math.floor(rows / 2);
  let startCol = Math.min(Math.max(Math.floor(cols * 0.2), 0), cols - 1);
  let endCol = Math.min(Math.max(Math.floor(cols * 0.8), 0), cols - 1);
  if (startCol === endCol) {
    startCol = 0;
    endCol = cols - 1;
  }
  return { start: { row, col: startCol }, end: { row, col: endCol } };
}

/** A blank grid (no walls) with start/end placed at sensible defaults. */
export function createEmptyGrid(rows: number, cols: number): Grid {
  const { start, end } = defaultStartEnd(rows, cols);
  const grid: Grid = [];
  for (let r = 0; r < rows; r++) {
    const rowArr: GridNode[] = [];
    for (let c = 0; c < cols; c++) {
      const isStart = r === start.row && c === start.col;
      const isEnd = r === end.row && c === end.col;
      rowArr.push({
        row: r,
        col: c,
        type: isStart ? "start" : isEnd ? "end" : "empty",
        weight: 1,
      });
    }
    grid.push(rowArr);
  }
  return grid;
}

/** Deep clone — needed because Grid lives in React state and every mutation
 * has to produce new node objects for change detection to work. */
export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.map((cell) => ({ ...cell })));
}

const NEIGHBOR_DELTAS: ReadonlyArray<readonly [number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/** 4-directional neighbors that are in bounds and not walls. This is the
 * entire "graph" as far as the pathfinding algorithms are concerned — the
 * grid is an implicit adjacency structure, nothing more explicit is built. */
export function getNeighbors(grid: Grid, pos: Position): Position[] {
  const dims = gridDimensions(grid);
  const result: Position[] = [];
  for (const [dr, dc] of NEIGHBOR_DELTAS) {
    const nr = pos.row + dr;
    const nc = pos.col + dc;
    if (isWithinBounds(dims, nr, nc) && grid[nr][nc].type !== "wall") {
      result.push({ row: nr, col: nc });
    }
  }
  return result;
}

export function findByType(grid: Grid, type: CellType): Position | null {
  for (const row of grid) {
    for (const cell of row) {
      if (cell.type === type) return { row: cell.row, col: cell.col };
    }
  }
  return null;
}

export function getStart(grid: Grid): Position {
  const pos = findByType(grid, "start");
  if (!pos) throw new Error("Grid has no start cell");
  return pos;
}

export function getEnd(grid: Grid): Position {
  const pos = findByType(grid, "end");
  if (!pos) throw new Error("Grid has no end cell");
  return pos;
}

/**
 * Returns a new grid with a single cell's type changed (immutable update —
 * used for wall drawing and mud toggling). Start/end cells are protected:
 * painting over them is a no-op here on purpose, since accidentally erasing
 * the anchor a wall-drag swept over would silently break the grid. Moving
 * start/end is a deliberate, separate action — see `moveAnchor`.
 */
export function setCellType(grid: Grid, pos: Position, type: CellType): Grid {
  const dims = gridDimensions(grid);
  if (!isWithinBounds(dims, pos.row, pos.col)) return grid;

  const current = grid[pos.row][pos.col];
  if (current.type === "start" || current.type === "end") return grid;

  const next = grid.map((row) => row.slice());
  next[pos.row][pos.col] = {
    ...current,
    type,
    weight: type === "mud" ? MUD_WEIGHT : 1,
  };
  return next;
}

/**
 * Moves the start or end marker to `to`, restoring its old cell to empty.
 * No-ops if the target is a wall or is the other anchor's current cell —
 * dragging start onto end (or onto a wall) should be silently rejected by
 * the UI layer rather than corrupting the grid.
 */
export function moveAnchor(grid: Grid, which: "start" | "end", to: Position): Grid {
  const dims = gridDimensions(grid);
  if (!isWithinBounds(dims, to.row, to.col)) return grid;

  const from = which === "start" ? getStart(grid) : getEnd(grid);
  const otherType: CellType = which === "start" ? "end" : "start";
  const target = grid[to.row][to.col];

  if (target.type === "wall" || target.type === otherType) return grid;
  if (from.row === to.row && from.col === to.col) return grid;

  const next = grid.map((row) => row.slice());
  next[from.row][from.col] = { ...next[from.row][from.col], type: "empty", weight: 1 };
  next[to.row][to.col] = { ...next[to.row][to.col], type: which, weight: 1 };
  return next;
}

export function countByType(grid: Grid, type: CellType): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.type === type) count++;
    }
  }
  return count;
}
