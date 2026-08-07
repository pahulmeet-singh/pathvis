import type { Grid, Position } from "../grid/types";
import { createWallGrid, getRoomNeighbors, wallBetween } from "./mazeUtils";

/**
 * Randomized DFS / "recursive backtracker" maze generation.
 *
 * Carves a spanning tree over the room-cell lattice using an explicit
 * stack: from the current room, pick a random unvisited room two steps
 * away, carve through to it, push it, repeat; backtrack (pop) when a room
 * has no unvisited neighbors left. An explicit stack is used instead of
 * recursion so grid size is never limited by call-stack depth, and so this
 * reads as the same "stack-based traversal" shape as DFS pathfinding
 * (lib/algorithms/dfs.ts) — same underlying idea, two different graphs.
 * Because every room is reached by carving from an already-connected room,
 * the result is a spanning tree by construction: fully connected, exactly
 * one path between any two rooms, no loops.
 *
 * Yields the position of each cell as it's carved (walls and rooms both,
 * in the order they're opened) so the caller can animate the carve.
 * Returns the finished grid (walls + carved passages only — start/end are
 * placed separately by `placeStartAndEnd`).
 *
 * Note: unlike the grid-editing functions in lib/grid, this mutates its
 * own private `grid` in place rather than doing immutable updates. That's
 * safe and intentional here — the grid is freshly created inside this
 * generator and never shared with anything else until the caller receives
 * the final return value, so there's no React state or aliasing to protect.
 */
export function* randomizedDFS(rows: number, cols: number): Generator<Position, Grid, void> {
  const grid = createWallGrid(rows, cols);

  const start: Position = { row: 0, col: 0 };
  grid[start.row][start.col].type = "empty";
  yield start;

  const stack: Position[] = [start];
  const visited = new Set<string>([`${start.row},${start.col}`]);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const unvisited = getRoomNeighbors(current, rows, cols).filter(
      (n) => !visited.has(`${n.row},${n.col}`),
    );

    if (unvisited.length === 0) {
      stack.pop();
      continue;
    }

    const next = unvisited[Math.floor(Math.random() * unvisited.length)];
    const wall = wallBetween(current, next);

    grid[wall.row][wall.col].type = "empty";
    grid[next.row][next.col].type = "empty";
    yield wall;
    yield next;

    visited.add(`${next.row},${next.col}`);
    stack.push(next);
  }

  return grid;
}
