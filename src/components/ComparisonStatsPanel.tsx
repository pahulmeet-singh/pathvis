import { ALGORITHMS, type AlgorithmId } from "@/lib/algorithms";
import type { SolveDisplay } from "@/hooks/useSolver";

export interface ComparisonStatsPanelProps {
  algorithmIdA: AlgorithmId;
  displayA: SolveDisplay | null;
  algorithmIdB: AlgorithmId;
  displayB: SolveDisplay | null;
}

interface StatRow {
  label: string;
  a: string;
  b: string;
}

export function ComparisonStatsPanel({ algorithmIdA, displayA, algorithmIdB, displayB }: ComparisonStatsPanelProps) {
  const algoA = ALGORITHMS[algorithmIdA];
  const algoB = ALGORITHMS[algorithmIdB];

  if (!displayA && !displayB) {
    return (
      <div className="rounded-xl border border-console-border bg-console-panel p-4">
        <h2 className="mb-1 text-sm font-semibold text-console-ink">Stats</h2>
        <p className="text-sm text-console-ink-muted">
          Click Compare to run both algorithms and see nodes visited, path length, and timing side by side.
        </p>
      </div>
    );
  }

  const rows: StatRow[] = [
    {
      label: "Nodes visited",
      a: displayA ? displayA.stats.visitedCount.toLocaleString() : "—",
      b: displayB ? displayB.stats.visitedCount.toLocaleString() : "—",
    },
    {
      label: "Path length",
      a: displayA ? (displayA.stats.pathFound ? `${displayA.stats.pathLength} cells` : "No path") : "—",
      b: displayB ? (displayB.stats.pathFound ? `${displayB.stats.pathLength} cells` : "No path") : "—",
    },
    { label: "Time complexity", a: algoA.timeComplexity, b: algoB.timeComplexity },
    {
      label: "Execution time",
      a: displayA ? `${displayA.stats.executionTimeMs.toFixed(2)} ms` : "—",
      b: displayB ? `${displayB.stats.executionTimeMs.toFixed(2)} ms` : "—",
    },
  ];

  return (
    <div className="rounded-xl border border-console-border bg-console-panel p-4">
      <h2 className="mb-3 text-sm font-semibold text-console-ink">Stats</h2>
      <div className="mb-2 grid grid-cols-[1fr_auto_auto] gap-x-3">
        <span />
        <span className="text-right text-xs font-semibold text-console-ink-muted" title={algoA.label}>
          A
        </span>
        <span className="text-right text-xs font-semibold text-console-ink-muted" title={algoB.label}>
          B
        </span>
      </div>
      <dl className="flex flex-col gap-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-3">
            <dt className="text-xs text-console-ink-muted">{row.label}</dt>
            <dd className="text-right font-mono font-medium tabular-nums text-console-ink">{row.a}</dd>
            <dd className="text-right font-mono font-medium tabular-nums text-console-ink">{row.b}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
