import { ALGORITHMS, type AlgorithmId } from "@/lib/algorithms";
import type { SolveDisplay } from "@/hooks/useSolver";

export interface StatsPanelProps {
  algorithmId: AlgorithmId;
  display: SolveDisplay | null;
}

export function StatsPanel({ algorithmId, display }: StatsPanelProps) {
  const algo = ALGORITHMS[algorithmId];

  if (!display) {
    return (
      <div className="rounded-xl border border-console-border bg-console-panel p-4">
        <h2 className="mb-1 text-sm font-semibold text-console-ink">Stats</h2>
        <p className="text-sm text-console-ink-muted">
          Run an algorithm to see nodes visited, path length, and timing here.
        </p>
      </div>
    );
  }

  const { stats } = display;

  return (
    <div className="rounded-xl border border-console-border bg-console-panel p-4">
      <h2 className="mb-3 text-sm font-semibold text-console-ink">Stats — {algo.label}</h2>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <StatRow label="Nodes visited" value={stats.visitedCount.toLocaleString()} />
        <StatRow
          label="Path length"
          value={stats.pathFound ? `${stats.pathLength} cells` : "No path found"}
        />
        <StatRow label="Time complexity" value={algo.timeComplexity} />
        <StatRow label="Execution time" value={`${stats.executionTimeMs.toFixed(2)} ms`} />
      </dl>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-console-ink-muted">{label}</dt>
      <dd className="font-mono font-medium tabular-nums text-console-ink">{value}</dd>
    </div>
  );
}
