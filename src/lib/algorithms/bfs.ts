import type { Grid, Position } from "../grid/types";
import { getNeighbors, posKey } from "../grid/gridUtils";
import type { AlgoGenerator } from "./types";
import { reconstructPath } from "./pathUtils";

/**
 * BFS — plain queue, every edge treated as cost 1 regardless of the grid's
 * actual weights. That's deliberate: BFS doesn't know weights exist. It
 * guarantees the shortest path in terms of *number of edges* on an
 * unweighted grid; on a weighted (mud) grid it can return a path that's
 * shorter in cell-count but more expensive in total cost than Dijkstra's.
 * That gap is the whole pedagogical point of including BFS next to
 * Dijkstra (PRD §7) — see the mud test in tests/algorithms.test.ts.
 *
 * The queue is a plain array with a head-index pointer rather than
 * `.shift()` (which is O(n) per call), keeping dequeue O(1) amortized.
 */
export function* bfs(grid: Grid, start: Position, end: Position): AlgoGenerator {
  const queue: Position[] = [start];
  let head = 0;
  const cameFrom = new Map<string, Position>();
  const seen = new Set<string>([posKey(start)]);
  let visitedCount = 0;

  while (head < queue.length) {
    const current = queue[head++];
    visitedCount++;
    yield { type: "visit", row: current.row, col: current.col };

    if (current.row === end.row && current.col === end.col) {
      const path = reconstructPath(cameFrom, start, end);
      for (const p of path) yield { type: "path", row: p.row, col: p.col };
      return { visitedCount, path, pathLength: path.length };
    }

    for (const neighbor of getNeighbors(grid, current)) {
      const key = posKey(neighbor);
      if (!seen.has(key)) {
        seen.add(key);
        cameFrom.set(key, current);
        queue.push(neighbor);
      }
    }
  }

  return { visitedCount, path: null, pathLength: 0 };
}
