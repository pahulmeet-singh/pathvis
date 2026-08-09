import { CELL_COLORS } from "./canvasPalette";

interface LegendItem {
  label: string;
  color: string;
  shape: "square" | "circle" | "diamond";
}

const LEGEND_ITEMS: LegendItem[] = [
  { label: "Wall", color: CELL_COLORS.wall, shape: "square" },
  { label: "Mud (weighted)", color: CELL_COLORS.mud, shape: "square" },
  { label: "Visited", color: CELL_COLORS.visited, shape: "square" },
  { label: "Frontier", color: CELL_COLORS.frontier, shape: "square" },
  { label: "Path", color: CELL_COLORS.path, shape: "square" },
  { label: "Start", color: CELL_COLORS.start, shape: "circle" },
  { label: "End", color: CELL_COLORS.end, shape: "diamond" },
];

const SHAPE_CLASS: Record<LegendItem["shape"], string> = {
  square: "rounded-sm",
  circle: "rounded-full",
  diamond: "rotate-45",
};

export function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            className={`inline-block h-3 w-3 border border-slate-300 ${SHAPE_CLASS[item.shape]}`}
            style={{ backgroundColor: item.color }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
