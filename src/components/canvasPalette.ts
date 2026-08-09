import type { CellType } from "@/lib/grid/types";

/**
 * Cell fill colors used directly as canvas `fillStyle` values — literal
 * hex, not CSS variables, since the 2D canvas context can't resolve
 * `var(--...)`. Tied to the console design system (step 9) without
 * breaking the grid's own usability convention: light/passable, dark/wall
 * stays intact (the most legible, most universally-recognized convention
 * for this kind of tool), while `wall` specifically uses a navy pulled
 * from the console panel family — walls read as "carved from the same
 * material as the console itself."
 *
 * Two saturation tiers by design: "wash" colors (visited, path) are pale
 * and only ever fill a cell's background; "marker" colors (start, end,
 * frontier) are the more saturated, higher-attention ones, reserved for
 * the single most current/important cell. Keeps a glance-able hierarchy
 * even on a full, busy grid.
 */
export const CELL_COLORS: Record<CellType, string> & {
  gridLine: string;
  visited: string;
  path: string;
  frontier: string;
} = {
  empty: "#f8fafc",
  wall: "#1b2a41",
  mud: "#b5651d",
  start: "#2fa84f",
  end: "#dc3545",
  gridLine: "#e2e8f0",
  visited: "#bfe3f5",
  path: "#b7efc5",
  frontier: "#f2c94c",
};
