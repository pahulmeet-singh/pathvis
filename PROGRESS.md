# PathVis — Build Progress

> **If you're Claude and the user just said "continue":** read this whole
> file silently, then resume at the top item in "Next up." Don't re-explain
> the plan back to the user — just keep building. This file is a single
> current-status snapshot, not a running log — replace whole sections in
> place when a step completes, don't append a new "Status" block on top of
> an old one.

Build order (from Build_Prompt_Pathfinding_Visualizer.md), 12 steps total:
1. Project scaffold + folder structure — ✅ done
2. Grid/data model — ✅ done
3. Maze generation algorithms — ✅ done
4. Pathfinding algorithms as generator functions — ⬅ **next**
5. Canvas rendering + grid interactions
6. Control panel + stats panel
7. Animation engine tying algorithms to the UI
8. Comparison mode
9. Styling pass
10. Tests
11. README + viva cheat sheet + demo script
12. Final build check

---

## What's built so far

### Toolchain (step 1)
Vite + React 19 + TypeScript 6, Tailwind v4 (`@tailwindcss/vite`, CSS-first
config in `src/index.css`, no `tailwind.config.js`), Vitest wired into
`vite.config.ts` (`npm test` / `npm run test:watch`), path alias `@/` → `src/`.
`npm run build` and `npm run lint` (oxlint) both pass clean, zero warnings.

### `src/lib/grid/` (step 2)
- `types.ts`: `CellType`, `Position`, `GridNode` (structural only — row,
  col, type, weight; **no** visited/distance/previous, see "Architecture"
  below), `Grid`, `MUD_WEIGHT`.
- `gridUtils.ts`: `createEmptyGrid`, `defaultStartEnd`, `cloneGrid`,
  `getNeighbors` (4-directional, wall-excluded — this IS the graph
  adjacency logic every pathfinding algorithm uses), `setCellType`
  (immutable, protects start/end from being painted over), `moveAnchor`
  (immutable, rejects walls/the other anchor), `getStart`/`getEnd`/
  `findByType`, `countByType`, `posKey`, `gridDimensions`, `isWithinBounds`.
- Runtime-verified in `.scratch/verify-grid.ts` (neighbor counts, wall
  removal, immutability, anchor protection/rejection). All passed.

### `src/lib/mazeGen/` (step 3)
- `mazeUtils.ts`: `createWallGrid`, `getRoomNeighbors` (room-lattice trick:
  even row/col = room, odd = wall-between-rooms), `wallBetween`,
  `findNearestEmpty` (BFS flood fill), `placeStartAndEnd`.
- `randomizedDFS.ts`: recursive backtracker, explicit stack.
- `randomizedPrims.ts`: frontier-list growth, visibly branchier result.
- Both are generators yielding each carved cell, returning the finished
  `Grid`. `index.ts` exposes a `MAZE_ALGORITHMS` registry for the future
  dropdown (FR1).
- Runtime-verified in `.scratch/verify-mazegen.ts`: **both** algorithms at
  15×15, 20×30, 21×21, 8×8 — flood-fill from origin reaches exactly every
  carved cell (zero unreachable regions) at every size. `placeStartAndEnd`
  never collides, always lands on non-wall cells. All passed.

### Not started yet
Everything from step 4 onward (see build order above).

---

## Decisions the user should know about
1. **Tailwind v4, not v3** — current stable, Vite-native plugin, no
   `tailwind.config.js`/`postcss.config.js`.
2. **`src/App.tsx` is currently a minimal, explicitly-labeled placeholder**
   ("Scaffold OK" message) — this is the disclosed step-1-of-12 state, not
   the "zero placeholder code" rule being violated. Replaced for real in
   step 5.
3. **Tests live in top-level `/tests`**, not `src/tests`; `tsconfig.app.json`
   includes both `src` and `tests` so tests get the same path alias/
   strictness and are type-checked by `tsc -b` during `npm run build`.
4. **`.scratch/` is gitignored** — throwaway `npx tsx` scripts used to
   verify steps 2-4 at runtime before the formal Vitest suite goes in at
   step 10 (per the user's own step ordering). Not part of the deliverable.
5. **GitHub/Vercel account actions**: clean local git history is being kept
   the whole way through, and the project will be zero-config Vercel-
   deployable. I don't have the user's GitHub/Vercel credentials, so I
   can't personally push or trigger a deploy — exact copy-paste steps for
   both come at the end.

---

## Architecture notes (for my own future-session reference)

- **Data model split**: `GridNode` (in `Grid`, React state) is *structural
  only*. `visited`/`distance`/`previous` from the PRD's Node sketch are
  algorithm run-time scratch state — they live inside each generator's own
  local `Map`/`Set` closures (see step 4), never touch React state, and
  never get attached to grid cells. This is what lets the same static grid
  be handed to two simultaneous algorithm runs in comparison mode (step 8)
  without them clobbering each other's bookkeeping.
- **Algorithm contract (step 4, about to be built)**: every algorithm in
  `lib/algorithms/*.ts` is
  `function*(grid, start, end): Generator<AlgoStep, AlgoResult, void>`,
  yielding `{ type: "visit", row, col }` per node processed, then
  `{ type: "path", row, col }` per path cell (in order, start→end) right
  before returning `AlgoResult { visitedCount, path, pathLength }`
  (`path: null` if unreachable). Zero React imports in this folder (PRD
  requirement) — same reason maze gen has zero React imports.
- **Maze gen contract**: `function*(rows, cols): Generator<Position, Grid, void>`,
  yields each carved cell, returns the finished wall/empty `Grid`. Start/end
  placement is a deliberately separate pass (`placeStartAndEnd`), decoupled
  from carving.
- **Priority queue plan for step 4**: hand-rolled binary min-heap in
  `lib/algorithms/priorityQueue.ts`, shared by `dijkstra.ts` and `astar.ts`,
  using **lazy deletion** (push a new entry on distance improvement, skip
  stale entries when popped) rather than decrease-key — simpler to
  implement correctly, same asymptotic complexity, good viva line.
- **BFS queue**: plain array + head index pointer (not `.shift()`, which is
  O(n) per call) — O(1) amortized dequeue.
- **A\* heuristic**: Manhattan distance. Still admissible even with mud
  (weight ≥ 1 always), since Manhattan assumes minimum possible per-step
  cost of 1 — worth a line in the viva sheet.
