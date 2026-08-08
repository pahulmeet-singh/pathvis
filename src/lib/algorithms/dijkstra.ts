import type { Grid, Position } from "../grid/types";
import { getNeighbors, posKey } from "../grid/gridUtils";
import type { AlgoGenerator } from "./types";
import { reconstructPath } from "./pathUtils";
import { MinPriorityQueue } from "./priorityQueue";

/**
 * Dijkstra — BFS generalized to weighted edges: swap the plain queue for a
 * min-priority-queue ordered by distance-so-far, so the cheapest frontier
 * node expands next instead of just the oldest-enqueued one. Respects
 * `weight` (mud cells cost more to *enter* — the cost is attributed to the
 * destination cell, not the source), so this is the first algorithm here
 * that actually diverges from BFS once weighted terrain is on the grid.
 *
 * `finalized` plays the role BFS's `seen` set plays, but named
 * differently on purpose: once a node is popped here its distance is
 * *provably* final (nothing left in the queue can beat it, since the
 * queue only pops in non-decreasing priority order) — that's a stronger,
 * more specific claim than "we've seen it," and it's the fact the whole
 * correctness argument for Dijkstra rests on.
 */
export function* dijkstra(grid: Grid, start: Position, end: Position): AlgoGenerator {
  const dist = new Map<string, number>();
  const cameFrom = new Map<string, Position>();
  const finalized = new Set<string>();
  const pq = new MinPriorityQueue<Position>();

  dist.set(posKey(start), 0);
  pq.push(start, 0);
  let visitedCount = 0;

  while (pq.size > 0) {
    const current = pq.pop()!;
    const key = posKey(current);
    if (finalized.has(key)) continue; // stale entry from an earlier, worse push
    finalized.add(key);
    visitedCount++;
    yield { type: "visit", row: current.row, col: current.col };

    if (current.row === end.row && current.col === end.col) {
      const path = reconstructPath(cameFrom, start, end);
      for (const p of path) yield { type: "path", row: p.row, col: p.col };
      return { visitedCount, path, pathLength: path.length };
    }

    const currentDist = dist.get(key)!;
    for (const neighbor of getNeighbors(grid, current)) {
      const nKey = posKey(neighbor);
      if (finalized.has(nKey)) continue;
      const candidateDist = currentDist + grid[neighbor.row][neighbor.col].weight;
      if (candidateDist < (dist.get(nKey) ?? Infinity)) {
        dist.set(nKey, candidateDist);
        cameFrom.set(nKey, current);
        pq.push(neighbor, candidateDist);
      }
    }
  }

  return { visitedCount, path: null, pathLength: 0 };
}
