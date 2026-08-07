/**
 * Core grid data model (PRD §6).
 *
 * Deliberately minimal: a GridNode is *structural only* — what a cell IS,
 * not what an algorithm currently thinks about it. `visited`, `distance`,
 * and `previous` from the PRD's sketch are algorithm run-time scratch data,
 * not persisted grid state — see lib/algorithms/types.ts. Keeping them out
 * of here means the Grid stored in React state stays plain, serializable,
 * and trivial to clone/diff, and the same static grid can be handed to
 * several algorithm runs (e.g. comparison mode) without them stepping on
 * each other's bookkeeping.
 */

export type CellType = "empty" | "wall" | "start" | "end" | "mud";

/** Traversal cost multiplier for a "mud" (weighted terrain) cell. */
export const MUD_WEIGHT = 5;

export interface Position {
  row: number;
  col: number;
}

export interface GridNode extends Position {
  type: CellType;
  /** 1 for normal cells, MUD_WEIGHT for mud. Irrelevant for walls. */
  weight: number;
}

export type Grid = GridNode[][];

export interface GridDimensions {
  rows: number;
  cols: number;
}
