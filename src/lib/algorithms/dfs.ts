import type { Grid, Position } from "../grid/types";
import { getNeighbors, posKey } from "../grid/gridUtils";
import type { AlgoGenerator } from "./types";
import { reconstructPath } from "./pathUtils";

/**
 * DFS — explicit stack, the same shape as the maze generator's carving
 * loop (lib/mazeGen/randomizedDFS.ts): same idea, different graph. It is
 * deliberately NOT shortest-path: it commits to a neighbor and only
 * backtracks once it runs out of unvisited options, so the discovered
 * path can be far longer than necessary. Included specifically to make
 * that visible next to BFS/Dijkstra/A* (PRD §7).
 *
 * Neighbor order is shuffled before pushing. With a *fixed* exploration
 * order (e.g. always up/down/left/right), DFS on an open grid can walk
 * straight to the goal with zero backtracking whenever the fixed order
 * happens to favor the goal's direction — which makes it look deceptively
 * optimal and defeats the reason it's in the app. Any exploration order is
 * still valid DFS (order of neighbor visitation isn't part of DFS's
 * definition), so this doesn't change correctness — it just means the
 * wandering, backtracking behavior that makes DFS pedagogically useful is
 * actually visible, not just theoretically true.
 *
 * A cell can be pushed more than once before it's actually processed
 * (nothing marks it "seen" at push time, only at pop time) — that's
 * normal for a simple explicit-stack DFS; duplicate entries are skipped
 * harmlessly by the `visited` check when they're eventually popped.
 */
export function* dfs(grid: Grid, start: Position, end: Position): AlgoGenerator {
  const stack: Position[] = [start];
  const cameFrom = new Map<string, Position>();
  const visited = new Set<string>();
  let visitedCount = 0;

  while (stack.length > 0) {
    const current = stack.pop()!;
    const key = posKey(current);
    if (visited.has(key)) continue;
    visited.add(key);
    visitedCount++;
    yield { type: "visit", row: current.row, col: current.col };

    if (current.row === end.row && current.col === end.col) {
      const path = reconstructPath(cameFrom, start, end);
      for (const p of path) yield { type: "path", row: p.row, col: p.col };
      return { visitedCount, path, pathLength: path.length };
    }

    for (const neighbor of shuffle(getNeighbors(grid, current))) {
      const nKey = posKey(neighbor);
      if (!visited.has(nKey)) {
        if (!cameFrom.has(nKey)) cameFrom.set(nKey, current);
        stack.push(neighbor);
      }
    }
  }

  return { visitedCount, path: null, pathLength: 0 };
}

/** Fisher-Yates shuffle, used to randomize DFS's neighbor exploration order. */
function shuffle<T>(items: T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
