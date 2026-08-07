/**
 * App.tsx — top-level shell.
 *
 * This is a deliberately minimal placeholder for the scaffold step (build
 * step 1 of the PathVis build plan). It exists to prove the toolchain works
 * end-to-end: Vite + React + TypeScript + Tailwind all compiling and
 * rendering together.
 *
 * Grid state, algorithm wiring, the control/stats panels, and the canvas
 * renderer are NOT implemented yet — they land in steps 2-7 per PROGRESS.md.
 * This file will be replaced with the real app shell in step 5.
 */
function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-neutral-950 text-neutral-100">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">
        PathVis
      </h1>
      <p className="text-neutral-400">
        Scaffold OK — toolchain wired up. Grid + algorithms coming in the next steps.
      </p>
    </div>
  )
}

export default App
