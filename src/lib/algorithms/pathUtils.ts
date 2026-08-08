import type { Position } from "../grid/types";
import { posKey } from "../grid/gridUtils";

/**
 * Walks the `cameFrom` chain backward from `end` to `start` and returns
 * the path in forward order (start → end, inclusive of both). Returns []
 * if the chain never reaches start — shouldn't happen for a correctly
 * recorded search, but this fails safe (empty path) rather than looping
 * forever or throwing.
 */
export function reconstructPath(
  cameFrom: Map<string, Position>,
  start: Position,
  end: Position,
): Position[] {
  const path: Position[] = [end];
  let currentKey = posKey(end);
  const startKey = posKey(start);

  while (currentKey !== startKey) {
    const prev = cameFrom.get(currentKey);
    if (!prev) return [];
    path.unshift(prev);
    currentKey = posKey(prev);
  }

  return path;
}
