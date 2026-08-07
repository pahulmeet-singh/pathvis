import type { Grid, Position } from "../grid/types";
import { createWallGrid, getRoomNeighbors, wallBetween } from "./mazeUtils";

/**
 * Randomized Prim's maze generation.
 *
 * Grows the maze outward from a single room via a frontier list instead of
 * a stack: repeatedly pick a random room from the frontier, connect it to
 * one of its already-carved neighbors, then add its own unvisited
 * neighbors to the frontier. Because the next carve is chosen from the
 * *entire* frontier rather than always extending the most recently carved
 * corridor, this produces shorter dead ends and a more "branchy" look than
 * the recursive backtracker — same spanning-tree guarantee (fully
 * connected, no loops), visibly different shape once carved.
 *
 * Yields one step per carved cell (wall then room), same contract as
 * randomizedDFS, so the animation engine and comparison-mode caller don't
 * need to know which maze algorithm produced the sequence.
 */
export function* randomizedPrims(rows: number, cols: number): Generator<Position, Grid, void> {
  const grid = createWallGrid(rows, cols);

  const start: Position = { row: 0, col: 0 };
  grid[start.row][start.col].type = "empty";
  yield start;

  const visited = new Set<string>([`${start.row},${start.col}`]);
  const frontier: Position[] = getRoomNeighbors(start, rows, cols);

  while (frontier.length > 0) {
    const idx = Math.floor(Math.random() * frontier.length);
    const candidate = frontier[idx];
    frontier.splice(idx, 1);

    const key = `${candidate.row},${candidate.col}`;
    if (visited.has(key)) continue; // can be queued more than once; skip stale entries

    const carvedNeighbors = getRoomNeighbors(candidate, rows, cols).filter((n) =>
      visited.has(`${n.row},${n.col}`),
    );
    if (carvedNeighbors.length === 0) continue; // defensive; shouldn't occur

    const connectTo = carvedNeighbors[Math.floor(Math.random() * carvedNeighbors.length)];
    const wall = wallBetween(candidate, connectTo);

    grid[wall.row][wall.col].type = "empty";
    grid[candidate.row][candidate.col].type = "empty";
    yield wall;
    yield candidate;

    visited.add(key);
    for (const n of getRoomNeighbors(candidate, rows, cols)) {
      if (!visited.has(`${n.row},${n.col}`)) frontier.push(n);
    }
  }

  return grid;
}
