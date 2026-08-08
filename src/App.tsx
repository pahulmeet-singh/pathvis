import { useGridEditor } from "@/hooks/useGridEditor";
import { GridCanvas } from "@/components/GridCanvas";

/**
 * App.tsx — top-level shell.
 *
 * As of step 5, this wires the grid editor hook to the canvas and nothing
 * else yet: no control panel, no stats panel, no algorithms running. That
 * is correct for where the build is (steps 6-9 add the rest) — see
 * PROGRESS.md. Nothing here is a stub; every piece present actually works.
 */
function App() {
  const { grid, locked, handleCellMouseDown, handleCellMouseEnter } = useGridEditor();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          PathVis
        </h1>
        <p className="text-sm text-slate-500">Pathfinding &amp; maze visualizer</p>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <p className="mb-3 text-sm text-slate-500">
          Click and drag to draw walls · drag the green or red marker to move start/end · hold{" "}
          <kbd className="rounded border border-slate-300 bg-white px-1 py-0.5 text-xs">Shift</kbd> and click
          to place mud
        </p>
        <GridCanvas
          grid={grid}
          disabled={locked}
          onCellMouseDown={handleCellMouseDown}
          onCellMouseEnter={handleCellMouseEnter}
        />
      </main>
    </div>
  );
}

export default App;
