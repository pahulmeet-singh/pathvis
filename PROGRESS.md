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
5. Canvas rendering + grid interactions — ✅ done
6. Control panel + stats panel — ✅ done
7. Animation engine tying algorithms to the UI — ⬅ **next**
8. Comparison mode
9. Styling pass
10. Tests
11. README + viva cheat sheet + demo script
12. Final build check

**Note on the user's situation:** the person building this cannot run
`npm run dev` themselves at this stage (not a strong coder yet, per their
own build prompt). I have no browser in this sandbox either. Given that
combination, I've been proactively using the Visualizer tool to show
faithful hand-ported previews (same colors, same algorithm logic) inline
in chat so they get *some* visual confidence without needing to install
anything — most recently a live clickable BFS demo. These are recreations
for illustration, not the literal running app — worth doing again after
step 7 (animation) and step 9 (styling) land, since those are the two
remaining steps with the highest "hard to picture from text" payoff.

---

## What's built so far

### Toolchain (step 1)
Vite + React 19 + TypeScript 6, Tailwind v4, Vitest wired in, path alias
`@/` → `src/`. `npm run build` and `npm run lint` (oxlint) clean throughout.

### `src/lib/grid/` (step 2, gridEditing.ts step 5)
Types, creation/cloning/neighbors, immutable cell/anchor edits, pure
mouse-interaction rules. Runtime-verified.

### `src/lib/mazeGen/` (step 3, generateInstantly.ts step 6)
`randomizedDFS`, `randomizedPrims` (generators, verified fully connected
at multiple sizes), `placeStartAndEnd`, and now `generateMazeInstantly`
(drains a maze generator + places anchors in one synchronous call — what
step 6's "Generate maze" button uses; step 7 adds a progressive version).

### `src/lib/algorithms/` (step 4, runInstantly.ts step 6)
`bfs`, `dfs` (randomized neighbor order), `dijkstra`, `astar`, hand-rolled
`MinPriorityQueue`, `ALGORITHMS` registry. Now also `runAlgorithmInstantly`
(drains a run, collects visited/path arrays, measures real compute time
excluding any future animation delay) — what "Visualize" uses today.
Verified: matches the raw generator's own result exactly, and correctly
solves a real generated maze end-to-end.

### `src/components/`, `src/hooks/` (step 5, substantially extended step 6)
- **`GridCanvas.tsx`**: now also accepts optional `visited`/`path` position
  arrays and renders them as overlay fills (light blue / green), with
  start/end always keeping their own dedicated color+marker regardless of
  overlay state. The component still doesn't know or care whether those
  arrays came from an instant run or a future animated one — same props,
  same rendering, only the *caller's* timing changes in step 7.
- **`canvasPalette.ts`**: added `visited`/`path` colors.
- **`Legend.tsx`** (new): reads swatches directly from `canvasPalette`, so
  the legend and the actual rendering can never drift apart. Covers PRD
  §10's "color legend always visible" for every state that currently
  exists (wall, mud, visited, path, start, end) — "frontier" gets added
  once step 7 introduces that concept for real.
- **`ControlPanel.tsx`** (new): maze picker + Generate maze, algorithm
  picker (+ its one-line description straight from the `ALGORITHMS`
  registry) + Visualize, a grid-size slider (`MIN_GRID_SIZE`-`MAX_GRID_SIZE`,
  square grids per the size-decision below), Reset / Clear grid. Every
  control is wired to something real — nothing here is inert.
- **`StatsPanel.tsx`** (new): FR9 — nodes visited, path length, theoretical
  time complexity (from the registry), measured execution time. Renders an
  honest "no run yet" empty state before the first Visualize click, not a
  placeholder with fake numbers.
- **`useSolver.ts`** (new hook): owns the current run's display state.
  `solve()` is synchronous today; its *public shape* (`display`, `solve`,
  `reset`) is designed so step 7 can swap the inside of `solve` for a
  timer-driven loop without changing anything that calls it.
- **`useGridEditor.ts`**: removed the unused `clearWalls` (added in step 5
  speculatively, never wired to a control — see decisions).
- **`App.tsx`**: real two-column layout (grid + legend on the left,
  control/stats panel on the right, stacks to one column on narrow
  screens). Any manual grid edit, algorithm-dropdown change, resize, or
  maze regen invalidates a stale displayed result — old paths never linger
  next to a grid they no longer describe.

### Verification status
- `tsc -b`, `npm run build`, `npm run lint`: clean.
- All prior `.scratch/*.ts` scripts re-run and still pass after this
  step's edits (5 files, zero regressions).
- New: `.scratch/verify-instant-run.ts` — confirms `runAlgorithmInstantly`'s
  collected visited/path arrays exactly match the underlying generator's
  own counts, and that `generateMazeInstantly` + BFS together solve a real
  generated maze end-to-end (connectivity + solvability, not just
  isolated-unit-level correctness).
- **Still true from step 5**: I cannot see the canvas myself (no browser in
  this sandbox). To partially bridge that gap given the user also can't
  run this locally right now, I built two Visualizer-tool previews this
  step: a static palette/marker preview, and a **live interactive BFS
  demo** (click a cell to toggle a wall, watch the visited trail and path
  re-route) using the same colors and the same BFS logic as the real app.
  These are faithful hand-ports for demonstration, not literally executing
  the TypeScript source — real confidence in the actual files still comes
  from tsc/build/lint plus code review, not from the widget.

### Not started yet
Steps 7-12 (see build order above).

---

## Decisions the user should know about
*(1-6 unchanged from before — Tailwind v4, tests in top-level `/tests`,
`.scratch/` gitignored, GitHub/Vercel needs the user's own credentials,
DFS neighbor shuffle, square grids by default — see git log on earlier
commits for the original reasoning.)*

7. **"Visualize" and "Generate maze" are real but not yet animated.**
   Clicking them runs the actual algorithm/maze-gen code from steps 3-4 and
   shows the genuine result (real stats, real path) — instantly, all at
   once, rather than revealed step-by-step. This is a deliberate reading
   of "zero placeholder code": the PRD's own 12-step order puts "control
   panel + stats panel" (6) before "animation engine" (7), and an
   instant-but-correct reveal is a real, working feature at each stage,
   not a stub — step 7 makes it progressively revealed, it doesn't create
   the underlying computation from scratch.
8. **Removed `clearWalls` from `useGridEditor`.** It was added in step 5
   speculatively but doesn't match either of FR10's two actions (reset =
   keep walls, clear = brand new grid) and nothing called it — kept as
   dead code it would have violated the same "everything present actually
   works and is used" discipline as the placeholder-code rule.
9. **Grid edits (drawing, dragging anchors), algorithm-dropdown changes,
   resizing, and maze regeneration all clear any displayed run result.**
   An old visited/path overlay computed against a grid that has since
   changed would be actively misleading (e.g. a "path" cell that's now a
   wall), so it's cleared rather than left stale.

---

## Architecture notes (for my own future-session reference)

- **For step 7 (animation engine), next:** replace the inside of
  `useSolver.solve()` with a version that calls `algo.run(...).next()` on
  a `setInterval`/`requestAnimationFrame` loop, pushing each yielded step
  into `display.visited`/`display.path` progressively instead of via
  `runAlgorithmInstantly`'s all-at-once drain — `GridCanvas` needs zero
  changes (it already renders whatever `visited`/`path` arrays it's
  given). Also: (a) set `locked=true` on `useGridEditor` for the run's
  duration and thread it into `ControlPanel` as a real `disabled` prop
  (intentionally not added in step 6 since it would've been permanently
  false and therefore pointless until now); (b) wire the same progressive
  approach into "Generate maze" via `mazeAlgo.run(...)` directly instead
  of `generateMazeInstantly`; (c) add the animation-speed control to
  `ControlPanel` (also skipped in step 6 for the same "would do nothing
  yet" reason); (d) add a "frontier / currently checking" highlight and
  its `Legend` entry, now that it's a real concept.
- **For step 9 (styling pass):** re-read `/mnt/skills/public/frontend-design/SKILL.md`.
  Also still owed from the PRD: the collapsible in-app "How it works"
  panel (PRD §10) — noted here so it doesn't slip through the cracks; it
  wasn't part of any of the 12 named build steps explicitly, so it's
  slotted into the styling pass rather than invented a step for.
- Data model split, algorithm/maze-gen generator contracts, priority
  queue/BFS-queue/A*-heuristic choices: unchanged, see step 4 commit.
