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
4. Pathfinding algorithms as generator functions — ✅ done
5. Canvas rendering + grid interactions — ⬅ **next**
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
- `types.ts`: `CellType`, `Position`, `GridNode` (structural only), `Grid`, `MUD_WEIGHT`.
- `gridUtils.ts`: `createEmptyGrid`, `defaultStartEnd`, `cloneGrid`,
  `getNeighbors` (4-directional, wall-excluded — the graph adjacency
  logic), `setCellType` (immutable, protects start/end), `moveAnchor`
  (immutable, rejects walls/the other anchor), `getStart`/`getEnd`/
  `findByType`, `countByType`, `posKey`, `gridDimensions`, `isWithinBounds`.
- Runtime-verified in `.scratch/verify-grid.ts`. All passed.

### `src/lib/mazeGen/` (step 3)
- `mazeUtils.ts`: `createWallGrid`, `getRoomNeighbors` (room-lattice
  trick), `wallBetween`, `findNearestEmpty`, `placeStartAndEnd`.
- `randomizedDFS.ts` (recursive backtracker, explicit stack),
  `randomizedPrims.ts` (frontier-list growth). Both generators, same
  yield/return contract. `index.ts` exposes `MAZE_ALGORITHMS` registry.
- Runtime-verified: both algorithms, 4 grid sizes incl. non-square, **zero
  unreachable regions** every time. `placeStartAndEnd` never collides.

### `src/lib/algorithms/` (step 4)
- `types.ts`: `AlgoStep` (`"visit" | "path"`), `AlgoResult`
  (`visitedCount`, `path: Position[] | null`, `pathLength`), `AlgoGenerator`, `AlgoFn`.
- `priorityQueue.ts`: hand-rolled binary min-heap, `MinPriorityQueue<T>`,
  lazy-deletion pattern (no decrease-key).
- `pathUtils.ts`: `reconstructPath` (walks `cameFrom` backward).
- `bfs.ts`: plain queue (array + head index, not `.shift()`), ignores weight.
- `dfs.ts`: explicit stack, **neighbor order is shuffled** — see Decision #6.
- `dijkstra.ts`: priority queue on distance-so-far, respects `weight`.
- `astar.ts`: priority queue on distance-so-far + Manhattan heuristic.
- `index.ts`: barrel + `ALGORITHMS` registry (label, one-line description,
  guarantees-shortest-path flag, time/space complexity strings, `run`) —
  single source of truth the control panel, stats panel, and viva sheet
  will all read from.
- Runtime-verified in `.scratch/verify-algorithms.ts`, run 5x (DFS is now
  randomized so it needed repeat runs, not just one):
  - All four algorithms find valid, contiguous start→end paths on an open grid.
  - BFS and Dijkstra agree on path **length** when all weights are 1.
  - A* visited count ≤ Dijkstra's, both on an open grid and a real
    generated maze; A*/Dijkstra path lengths match (both optimal).
  - Mud test: BFS took the direct route (cost 8, ignoring the mud
    penalty); Dijkstra/A* both detoured around it for a cheaper path
    (cost 6) — this is the concrete, numeric proof that mud makes the
    algorithms *behave* differently, not just theoretically differ.
  - No-path case returns `path: null`, `pathLength: 0`, no crash, for all
    four algorithms.
  - `start === end` returns a length-1 path for all four.
  - All checks re-run 5x after randomizing DFS to confirm the shuffle
    never breaks correctness, only changes which (still valid) path is found.

### Not started yet
Everything from step 5 onward (see build order above).

---

## Decisions the user should know about
1. **Tailwind v4, not v3** — current stable, Vite-native plugin, no
   `tailwind.config.js`/`postcss.config.js`.
2. **`src/App.tsx` is currently a minimal, explicitly-labeled placeholder**
   — disclosed step-in-progress state, not the "zero placeholder code"
   rule being violated. Replaced for real in step 5 (next).
3. **Tests live in top-level `/tests`**, not `src/tests`; `tsconfig.app.json`
   includes both `src` and `tests`.
4. **`.scratch/` is gitignored** — throwaway `npx tsx` verification
   scripts for steps 2-4, not part of the deliverable. Step 10 turns the
   properties they checked into the real Vitest suite.
5. **GitHub/Vercel account actions**: clean local git history is being
   kept throughout; project will be zero-config Vercel-deployable. I don't
   have the user's credentials for either, so I can't personally push/
   deploy — exact steps for both come at the end.
6. **DFS's neighbor exploration order is randomized (Fisher-Yates shuffle)
   before pushing onto the stack.** With a fixed order (e.g. always
   up/down/left/right), DFS on an open grid can walk *straight* to the
   goal with zero backtracking whenever the fixed order happens to favor
   the goal's direction — confirmed this actually happened in testing
   (DFS found the exact shortest path, indistinguishable from BFS/A* in
   the demo). That defeats the entire reason DFS is in the app (PRD §7:
   "included specifically to visually demonstrate why BFS/Dijkstra
   matter"). Shuffling the order is still 100% valid DFS — visitation
   order was never part of DFS's definition — it just makes the
   wandering/backtracking behavior that's the whole point *visible*.
   Confirmed via 5 repeat runs that this doesn't break correctness, only
   changes which (still valid, still connected) path gets found.

---

## Architecture notes (for my own future-session reference)

- **Data model split**: `GridNode` (React state) is structural-only.
  `visited`/`distance`/`previous` from the PRD's Node sketch live only
  inside each generator's local closures — never touch React state, never
  attach to grid cells. Lets comparison mode (step 8) run two algorithms
  on the same static grid without them clobbering each other.
- **Algorithm contract**: `function*(grid, start, end): Generator<AlgoStep, AlgoResult, void>`,
  yields `{type:"visit",row,col}` per node processed, then
  `{type:"path",row,col}` per path cell (start→end order) right before
  returning `AlgoResult`. Zero React imports in `lib/algorithms/` or
  `lib/mazeGen/` (PRD requirement).
- **For step 5 (canvas rendering, next):** the canvas needs to render from
  `Grid` (structural: walls/mud/start/end) *plus* separate ephemeral
  render state for the current animation (visited set in visit-order,
  path set, current frontier cell) — that ephemeral state does not belong
  on `Grid` and doesn't exist yet; it gets designed properly in step 7
  (animation engine). For step 5 itself, GridCanvas only needs to render
  the static `Grid` correctly and handle mouse events (wall drawing,
  start/end dragging via `setCellType`/`moveAnchor` from step 2) — no
  animation wiring yet, that's step 7 on purpose per the user's ordering.
- **Frontend design direction for steps 5 & 9**: read `/mnt/skills/public/frontend-design/SKILL.md`
  guidance again before the styling pass. Subject-appropriate direction to
  explore: something in the technical/schematic register (circuit-board,
  topographic-map, or terminal/control-panel register) rather than the
  generic AI-tool defaults (warm cream+serif, near-black+single-accent,
  broadsheet) — a graph/grid algorithm visualizer has a lot of real
  material (grid coordinates, complexity notation, monospace data) to draw
  a distinctive identity from instead. Finalize the actual token system
  (colors/type/layout/signature) when step 9 starts, per the skill's
  two-pass brainstorm-then-critique process — don't lock it in casually
  as a side effect of step 5.
- **Priority queue**: lazy deletion (push on improvement, skip stale pops)
  rather than decrease-key.
- **BFS queue**: array + head index, not `.shift()`.
- **A\* heuristic**: Manhattan distance, still admissible with mud since
  weight ≥ 1 always.
