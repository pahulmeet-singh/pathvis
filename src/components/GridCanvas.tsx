import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Grid, Position } from "@/lib/grid/types";
import { gridDimensions } from "@/lib/grid/gridUtils";
import { CELL_COLORS } from "./canvasPalette";

const MIN_CELL_SIZE = 10;
const MAX_CELL_SIZE = 32;
const MAX_CANVAS_HEIGHT = 620;

export interface GridCanvasProps {
  grid: Grid;
  /** True while an algorithm/maze animation is running — freezes editing (PRD UI/UX: controls disabled mid-animation to prevent inconsistent state). */
  disabled?: boolean;
  /** Cells to paint as "visited" (light blue). Step 6 passes the full set
   * from an instant run; step 7 will instead grow this list over time to
   * animate it — this component doesn't care which, it just draws
   * whatever it's given. */
  visited?: Position[];
  /** Cells to paint as the final "path" (green), drawn after/over visited. */
  path?: Position[];
  onCellMouseDown?: (pos: Position, modifierHeld: boolean) => void;
  onCellMouseEnter?: (pos: Position) => void;
}

/**
 * Pure rendering + coordinate translation only — this component doesn't
 * know what a "wall" click *means* (see lib/grid/gridEditing.ts for that),
 * and doesn't know whether `visited`/`path` came from an instant run or a
 * timer-driven animation. It draws the grid and turns raw DOM mouse events
 * into cell positions, nothing more. Mouse-up is intentionally not handled
 * here: it's caught globally by `useGridEditor` so a drag that ends
 * outside the canvas still gets released.
 */
export function GridCanvas({
  grid,
  disabled = false,
  visited,
  path,
  onCellMouseDown,
  onCellMouseEnter,
}: GridCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastCellRef = useRef<Position | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const { rows, cols } = gridDimensions(grid);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const cellSize = useMemo(() => {
    if (containerWidth === 0 || rows === 0 || cols === 0) return MIN_CELL_SIZE;
    const byWidth = Math.floor(containerWidth / cols);
    const byHeight = Math.floor(MAX_CANVAS_HEIGHT / rows);
    return Math.max(MIN_CELL_SIZE, Math.min(byWidth, byHeight, MAX_CELL_SIZE));
  }, [containerWidth, rows, cols]);

  const canvasWidth = cellSize * cols;
  const canvasHeight = cellSize * rows;

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cellSize === 0 || canvasWidth === 0 || canvasHeight === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGrid(ctx, grid, cellSize, visited, path);
  }, [grid, cellSize, canvasWidth, canvasHeight, visited, path]);

  function cellFromEvent(e: React.MouseEvent<HTMLCanvasElement>): Position | null {
    const canvas = canvasRef.current;
    if (!canvas || cellSize === 0) return null;
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / cellSize);
    const row = Math.floor((e.clientY - rect.top) / cellSize);
    if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
    return { row, col };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (disabled || e.button !== 0) return;
    const pos = cellFromEvent(e);
    if (!pos) return;
    lastCellRef.current = pos;
    onCellMouseDown?.(pos, e.shiftKey);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (disabled) return;
    const pos = cellFromEvent(e);
    if (!pos) return;
    const last = lastCellRef.current;
    if (last && last.row === pos.row && last.col === pos.col) return;
    lastCellRef.current = pos;
    onCellMouseEnter?.(pos);
  }

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Pathfinding grid, ${rows} by ${cols} cells`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onDragStart={(e) => e.preventDefault()}
        className={`mx-auto block rounded-lg border border-slate-300 shadow-sm select-none ${
          disabled ? "cursor-not-allowed opacity-90" : "cursor-pointer"
        }`}
        style={{ touchAction: "none" }}
      />
    </div>
  );
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  cellSize: number,
  visited: Position[] | undefined,
  path: Position[] | undefined,
) {
  const { rows, cols } = gridDimensions(grid);

  // Sets for O(1) membership checks. Rebuilt on every draw, which only
  // happens once per "Visualize"/"Generate maze" click right now (step 6)
  // — cheap even at 1600 cells. Step 7's per-frame animation loop will
  // need to think harder about this; this component doesn't have to yet.
  const pathSet = new Set(path?.map((p) => `${p.row},${p.col}`));
  const visitedSet = new Set(visited?.map((p) => `${p.row},${p.col}`));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      const x = c * cellSize;
      const y = r * cellSize;
      const key = `${r},${c}`;

      let fill = CELL_COLORS[cell.type];
      // Start/end always show their own dedicated color + marker, never
      // the visited/path overlay — an anchor should never look "explored
      // over," it should always read as an anchor.
      if (cell.type !== "start" && cell.type !== "end") {
        if (pathSet.has(key)) fill = CELL_COLORS.path;
        else if (visitedSet.has(key)) fill = CELL_COLORS.visited;
      }

      ctx.fillStyle = fill;
      ctx.fillRect(x, y, cellSize, cellSize);

      if (cell.type === "start" || cell.type === "end") {
        drawAnchorMarker(ctx, x, y, cellSize, cell.type);
      }
    }
  }

  ctx.strokeStyle = CELL_COLORS.gridLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let r = 0; r <= rows; r++) {
    ctx.moveTo(0, r * cellSize + 0.5);
    ctx.lineTo(cols * cellSize, r * cellSize + 0.5);
  }
  for (let c = 0; c <= cols; c++) {
    ctx.moveTo(c * cellSize + 0.5, 0);
    ctx.lineTo(c * cellSize + 0.5, rows * cellSize);
  }
  ctx.stroke();
}

/** Start = filled circle, end = diamond. Different colors AND different
 * silhouettes on purpose — distinguishable without relying on color alone. */
function drawAnchorMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  type: "start" | "end",
) {
  const cx = x + cellSize / 2;
  const cy = y + cellSize / 2;
  const r = cellSize * 0.32;

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = CELL_COLORS[type];
  ctx.lineWidth = Math.max(1.5, cellSize * 0.1);

  ctx.beginPath();
  if (type === "start") {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else {
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
}
