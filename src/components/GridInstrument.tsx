import { useState } from "react";
import type { Position } from "@/lib/grid/types";
import { GridCanvas, type GridCanvasProps } from "./GridCanvas";

export interface GridInstrumentProps extends GridCanvasProps {
  /** Shown above the instrument, e.g. an algorithm name in comparison mode. */
  label?: string;
}

/**
 * The signature visual element (the step 9 design plan's "single unique
 * element," see PROGRESS.md). Corner brackets read as technical-drawing
 * registration marks; the coordinate readout is a genuinely useful
 * cursor-position indicator, not pure decoration — the same idea a design
 * tool's canvas gives you, which fits a *grid* tool specifically well.
 * Deliberately the only place in the app with this much visual flourish —
 * everywhere else stays quiet, per "spend your boldness in one place."
 */
export function GridInstrument({ label, ...canvasProps }: GridInstrumentProps) {
  const [hovered, setHovered] = useState<Position | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {label && <h2 className="text-sm font-semibold text-console-ink">{label}</h2>}
      <div className="relative">
        <CornerBracket className="-top-1 -left-1 border-t-2 border-l-2" />
        <CornerBracket className="-top-1 -right-1 border-t-2 border-r-2" />
        <CornerBracket className="-bottom-1 -left-1 border-b-2 border-l-2" />
        <CornerBracket className="-bottom-1 -right-1 border-b-2 border-r-2" />
        <GridCanvas {...canvasProps} onCellHover={setHovered} />
        {hovered && (
          <div className="pointer-events-none absolute right-2 bottom-2 rounded bg-console/90 px-2 py-0.5 font-mono text-xs tabular-nums text-signal-cyan">
            {hovered.row}, {hovered.col}
          </div>
        )}
      </div>
    </div>
  );
}

function CornerBracket({ className }: { className: string }) {
  return (
    <span aria-hidden="true" className={`pointer-events-none absolute h-4 w-4 border-signal-cyan/70 ${className}`} />
  );
}
