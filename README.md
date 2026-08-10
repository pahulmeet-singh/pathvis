# PathVis

**An interactive pathfinding and maze-generation visualizer.** Generate a
random maze, then watch BFS, DFS, Dijkstra, and A* solve it step by
step — or run two of them side by side, on identical mazes, synced to one
animation clock, to see *why* they behave differently instead of just
reading that they do.

Built as a final-year DSA project and CV piece: every visual element maps
directly to a specific, explainable data structure or algorithm, and the
codebase is small enough to walk through line-by-line in a viva.

**Live demo:** _https://pathvis-eta.vercel.app_

## Screenshots

_Add a screenshot or short GIF here once you've run the app locally —
`npm run dev`, generate a maze, run a comparison, and grab a capture.
There isn't one checked in yet because this project was built in an
environment with no browser available to take one; that's a real gap in
this README, not an oversight to quietly ignore._

## Features

- **Maze generation** — Randomized DFS (recursive backtracker) or
  Randomized Prim's, both guaranteed fully connected (no isolated
  pockets), user-selectable.
- **Manual editing** — click-and-drag to draw or erase walls, drag the
  start/end markers anywhere, hold `Shift` and click to place weighted
  "mud" terrain.
- **Four pathfinding algorithms** — BFS, DFS, Dijkstra, A* (Manhattan
  heuristic) — each a real generator function, animated step by step.
- **Comparison mode** — run two algorithms simultaneously on the *same*
  maze, synced to one animation clock, with side-by-side stats.
- **Live stats** — nodes visited, path length, theoretical time
  complexity, and measured execution time (real algorithmic compute time,
  excluding animation delay).
- **Adjustable animation speed and grid size** (15×15 up to 40×40).
- **"How it works" panel** — a short explainer for every algorithm, built
  into the app itself.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 19 + TypeScript 6 (Vite) | Fast build, industry-standard, easy for interviewers to recognize |
| Styling | Tailwind CSS v4 | Utility-first, CSS-native `@theme` tokens, no config-file sprawl |
| State | React `useState` + a handful of custom hooks (no Redux) | App state is simple enough that a state library would be unjustifiable overhead |
| Rendering | HTML5 Canvas | Smooth animation at scale — hundreds/thousands of DOM nodes would not perform as well |
| Testing | Vitest | Fast, native ESM, same toolchain as Vite |
| Deployment | Vercel (zero-config) | One command, free, gives a public URL |

No backend, no database — this is entirely front-end logic operating on
an in-memory 2D grid.

## Architecture

```
src/
  lib/
    grid/          Pure data model: CellType, Grid, GridNode, neighbor
                    logic, immutable cell/anchor edits, mouse-interaction
                    rules. Zero React imports.
    algorithms/     BFS, DFS, Dijkstra, A* — each a generator function
                    (function*) that yields one step at a time instead of
                    returning a final answer. Plus a hand-rolled binary
                    min-heap (MinPriorityQueue) and the ALGORITHMS
                    registry (single source of truth for labels,
                    descriptions, complexity, and the run function every
                    UI piece reads from). Zero React imports.
    mazeGen/        Randomized DFS and Randomized Prim's — same
                    generator-function contract as the pathfinding
                    algorithms. Zero React imports.
    animationSpeed.ts   Shared speed/delay config used by both animation
                        engines below.
  hooks/
    useGridEditor.ts      Owns the editable Grid; wires DOM mouse events
                          to the pure rules in lib/grid/gridEditing.ts.
    useSolver.ts          The pathfinding animation engine — steps a
                          generator via requestAnimationFrame with a time
                          accumulator (so pacing survives dropped
                          frames), or drains it instantly at "Instant"
                          speed.
    useMazeGenerator.ts   Same accumulator pattern, but progressively
                          mutates the Grid itself (walls -> empty) rather
                          than a separate overlay.
  components/       GridCanvas (canvas rendering + raw mouse-to-cell
                    translation only -- no editing logic, no animation
                    logic, just draws whatever it's handed), GridInstrument
                    (adds the corner-bracket bezel + coordinate readout),
                    ComparisonView, ControlPanel, StatsPanel,
                    ComparisonStatsPanel, Legend, HowItWorks.
  App.tsx           Top-level state (grid, algorithm choice(s), speed,
                    comparison mode) and wiring.
tests/              Vitest suite (56 tests) -- see Testing below.
docs/               VIVA_CHEAT_SHEET.md, DEMO_SCRIPT.md.
```

**Key design decision:** every pathfinding and maze-generation algorithm
is a JavaScript generator function that pauses after each meaningful step
and hands control back to the caller. The *exact same* generator powers
three different consumption modes without any of them needing their own
copy of the algorithm: drain it in a tight loop for an instant result,
step it on a `requestAnimationFrame` timer for an animated one, or (in
comparison mode) step two of them in the same handler and let
same-frame `requestAnimationFrame` timestamps keep them in lockstep with
no explicit coordination between them.

The grid itself is the graph: neighbors are computed on the fly
(up/down/left/right, bounds-checked, walls excluded) rather than stored
as an explicit adjacency list or matrix -- a deliberately simple, very
common representation for grid-based pathfinding.

## Running locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173` (Vite's default).

## Testing

```bash
npm test            # run the full Vitest suite once
npm run test:watch  # watch mode
```

56 tests across 5 files, covering everything the PRD requires automated
coverage for: maze connectivity (both algorithms, four grid sizes),
BFS/Dijkstra path-length agreement, A* visiting <= nodes than Dijkstra,
graceful no-path handling, plus grid-editing rules, the hand-rolled
priority queue, and the animation engine's pacing/sync properties.
UI-interaction testing (drawing, dragging, resizing, comparison-mode
sync) is a manual checklist by design --
[`tests/MANUAL_TEST_CHECKLIST.md`](tests/MANUAL_TEST_CHECKLIST.md) -- not
automated component tests; see that file for why.

## Building

```bash
npm run build   # type-checks (tsc -b) then produces a static build in dist/
npm run lint    # oxlint
```

`npm run build` produces a fully static site -- no server-side code, no
environment variables required -- deployable as-is to any static host.

## Deploying

This project needs zero configuration to deploy to Vercel:

1. Push this repository to GitHub (`git remote add origin <your-repo-url>`,
   then `git push -u origin main` -- the local commit history is already
   here, one commit per build step).
2. Go to [vercel.com/new](https://vercel.com/new), import the repository.
3. Vercel auto-detects Vite; accept the defaults and click Deploy.
4. Copy the resulting URL into the **Live demo** line at the top of this
   README.

Netlify works the same way (`npm run build`, publish directory `dist`).

## Viva prep

- [`docs/VIVA_CHEAT_SHEET.md`](docs/VIVA_CHEAT_SHEET.md) -- one page:
  complexity table, why A* beats Dijkstra, why DFS isn't optimal, how
  maze generation guarantees solvability, and a rehearsed Q&A set.
- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) -- a scripted ~3-minute
  walkthrough with suggested narration, so the live demo is rehearsed
  rather than improvised.
