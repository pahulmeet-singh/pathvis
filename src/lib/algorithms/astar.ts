import type { Grid, Position } from "../grid/types";
import { getNeighbors, posKey } from "../grid/gridUtils";
import type { AlgoGenerator } from "./types";
import { reconstructPath } from "./pathUtils";
import { MinPriorityQueue } from "./priorityQueue";

function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

/**
 * A* — Dijkstra plus a heuristic that biases the priority queue toward the
 * goal: priority = distance-so-far + estimated-distance-remaining, instead
 * of just distance-so-far. The estimate is Manhattan distance, which stays
 * *admissible* (never overestimates the true remaining cost) even with mud
 * on the grid — the cheapest possible single step still costs at least 1,
 * and Manhattan distance assumes exactly that minimum, so it can only ever
 * under-estimate. Admissibility is what keeps A* provably optimal (PRD
 * §13) while still visiting fewer nodes than plain Dijkstra: the heuristic
 * lets it deprioritize frontier nodes that are technically closer-so-far
 * but pointed away from the goal.
 */
export function* astar(grid: Grid, start: Position, end: Position): AlgoGenerator {
  const dist = new Map<string, number>();
  const cameFrom = new Map<string, Position>();
  const finalized = new Set<string>();
  const pq = new MinPriorityQueue<Position>();

  dist.set(posKey(start), 0);
  pq.push(start, manhattanDistance(start, end));
  let visitedCount = 0;

  while (pq.size > 0) {
    const current = pq.pop()!;
    const key = posKey(current);
    if (finalized.has(key)) continue;
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
        pq.push(neighbor, candidateDist + manhattanDistance(neighbor, end));
      }
    }
  }

  return { visitedCount, path: null, pathLength: 0 };
}
