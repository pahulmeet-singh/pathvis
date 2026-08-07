import type { Grid, GridNode, Position } from "../grid/types";
import { getNeighbors, gridDimensions, posKey } from "../grid/gridUtils";

/**
 * Both maze algorithms build on the same trick: treat cells at *even*
 * row/col as "rooms" and cells at *odd* row/col as the "wall" between two
 * adjacent rooms. Carving a passage between two rooms means opening the
 * room cell between them plus the room cell itself. Building the maze as a
 * spanning tree over this room-cell graph is what guarantees the result is
 * a "perfect maze" (exactly one path between any two rooms, fully
 * connected, zero loops) — no separate connectivity fixup pass is needed.
 *
 * For grids with an even `rows`/`cols`, the final row/col of cells sits
 * outside the room lattice and stays wall — a harmless one-cell border,
 * not a bug.
 */

export function createWallGrid(rows: number, cols: number): Grid {
  const grid: Grid = [];
  for (let r = 0; r < rows; r++) {
    const row: GridNode[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({ row: r, col: c, type: "wall", weight: 1 });
    }
    grid.push(row);
  }
  return grid;
}

const ROOM_DELTAS: ReadonlyArray<readonly [number, number]> = [
  [-2, 0],
  [2, 0],
  [0, -2],
  [0, 2],
];

/** Room cells two steps away from `pos` (the four candidate cells a carve
 * could connect to), bounds-checked. Does not check wall/visited state —
 * callers filter as needed. */
export function getRoomNeighbors(pos: Position, rows: number, cols: number): Position[] {
  const result: Position[] = [];
  for (const [dr, dc] of ROOM_DELTAS) {
    const nr = pos.row + dr;
    const nc = pos.col + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      result.push({ row: nr, col: nc });
    }
  }
  return result;
}

/** The single wall cell that sits directly between two room cells that are
 * exactly two apart (orthogonally). */
export function wallBetween(a: Position, b: Position): Position {
  return { row: (a.row + b.row) / 2, col: (a.col + b.col) / 2 };
}

/**
 * Finds the empty (non-wall) cell nearest to `from` via BFS flood fill and
 * returns it. Used to anchor start/end onto real passages regardless of
 * grid parity, rather than assuming (0,0)/(rows-1,cols-1) are carved.
 */
export function findNearestEmpty(grid: Grid, from: Position): Position {
  const dims = gridDimensions(grid);
  if (grid[from.row][from.col].type !== "wall") return from;

  const queue: Position[] = [from];
  let head = 0;
  const seen = new Set<string>([posKey(from)]);
  const deltas: ReadonlyArray<readonly [number, number]> = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (head < queue.length) {
    const current = queue[head++];
    for (const [dr, dc] of deltas) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      if (nr < 0 || nr >= dims.rows || nc < 0 || nc >= dims.cols) continue;
      const key = `${nr},${nc}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const next = { row: nr, col: nc };
      if (grid[nr][nc].type !== "wall") return next;
      queue.push(next);
    }
  }

  // Degenerate case (e.g. a 1x1 grid, or a grid with zero empty cells) —
  // fall back to the search origin rather than throwing.
  return from;
}

/**
 * Marks start near the top-left and end near the bottom-right of a carved
 * maze, snapping each to the nearest real passage. Kept as a separate pass
 * from the carving algorithms themselves so `randomizedDFS`/
 * `randomizedPrims` stay focused purely on "how do I build a spanning
 * tree" — anchor placement is a UI-facing concern, not a maze-generation
 * concept.
 */
export function placeStartAndEnd(grid: Grid): Grid {
  const dims = gridDimensions(grid);
  const start = findNearestEmpty(grid, { row: 0, col: 0 });
  const end = findNearestEmpty(grid, { row: dims.rows - 1, col: dims.cols - 1 });

  const next = grid.map((row) => row.map((cell) => ({ ...cell })));
  next[start.row][start.col] = { ...next[start.row][start.col], type: "start", weight: 1 };
  // Guard against a pathological 1-cell-empty maze where start and end
  // would collide — extremely unlikely at any real grid size, but cheap
  // to make impossible rather than merely unlikely.
  if (!(end.row === start.row && end.col === start.col)) {
    next[end.row][end.col] = { ...next[end.row][end.col], type: "end", weight: 1 };
  } else {
    const fallback = getNeighbors(next, start)[0] ?? start;
    next[fallback.row][fallback.col] = { ...next[fallback.row][fallback.col], type: "end", weight: 1 };
  }
  return next;
}
