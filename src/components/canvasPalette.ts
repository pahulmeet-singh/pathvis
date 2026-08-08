import type { CellType } from "@/lib/grid/types";

/**
 * Cell fill colors used directly as canvas `fillStyle` values. These live
 * here (not as CSS custom properties) because the 2D canvas context can't
 * resolve `var(--...)` — it needs literal color strings. This is a
 * functional working baseline for steps 5-8; the full visual identity
 * (exact hues, whether these get pulled from a shared design-token file)
 * is a deliberate step 9 decision, not something to lock in as a side
 * effect of getting the grid to render.
 */
export const CELL_COLORS: Record<CellType, string> & { gridLine: string; visited: string; path: string } = {
  empty: "#f8fafc",
  wall: "#1e293b",
  mud: "#92400e",
  start: "#16a34a",
  end: "#e11d48",
  gridLine: "#e2e8f0",
  visited: "#bfdbfe",
  path: "#86efac",
};
