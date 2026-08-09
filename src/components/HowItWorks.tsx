import { ALGORITHMS } from "@/lib/algorithms";
import { MAZE_ALGORITHMS } from "@/lib/mazeGen";

/**
 * Native <details>/<summary> — free keyboard accessibility (Enter/Space
 * toggles, no custom JS state, no ARIA to get wrong) rather than a
 * hand-rolled disclosure widget. Content is pulled directly from the
 * ALGORITHMS/MAZE_ALGORITHMS registries (single source of truth,
 * unchanged principle from steps 3-4) so this panel can't drift out of
 * sync with what the dropdowns actually offer.
 */
export function HowItWorks() {
  return (
    <details className="group rounded-xl border border-console-border bg-console-panel p-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-console-ink">
        <span className="inline-block text-signal-cyan transition-transform duration-150 group-open:rotate-90">
          ▸
        </span>
        How it works
      </summary>

      <div className="mt-4 flex flex-col gap-5">
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-signal-cyan uppercase">Pathfinding</h3>
          <dl className="flex flex-col gap-3">
            {Object.values(ALGORITHMS).map((a) => (
              <div key={a.id}>
                <dt className="text-sm font-medium text-console-ink">{a.label}</dt>
                <dd className="text-sm text-console-ink-muted">{a.howItWorks}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="flex flex-col gap-3 border-t border-console-border pt-4">
          <h3 className="text-xs font-semibold tracking-wide text-signal-cyan uppercase">Maze generation</h3>
          <dl className="flex flex-col gap-3">
            {Object.values(MAZE_ALGORITHMS).map((m) => (
              <div key={m.id}>
                <dt className="text-sm font-medium text-console-ink">{m.label}</dt>
                <dd className="text-sm text-console-ink-muted">{m.howItWorks}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </details>
  );
}
