# PathVis — Build Progress

**Status: all 12 build steps complete.** This file's job (helping a future
session silently resume mid-build) is done — kept in the repo as a build
history / decision log, not because more work is expected here. If you're
Claude and the user asks for something new on this project, read the
"Decisions" and "Architecture notes" sections below for context first,
but there's no "next step" to resume.

Build order (from Build_Prompt_Pathfinding_Visualizer.md):
1. Project scaffold + folder structure — ✅
2. Grid/data model — ✅
3. Maze generation algorithms — ✅
4. Pathfinding algorithms as generator functions — ✅
5. Canvas rendering + grid interactions — ✅
6. Control panel + stats panel — ✅
7. Animation engine tying algorithms to the UI — ✅
8. Comparison mode — ✅
9. Styling pass — ✅
10. Tests — ✅
11. README + viva cheat sheet + demo script — ✅
12. Final build check — ✅

---

## Step 12: Final build check

Ran the full verification from a genuinely clean state, not just trusted
the last run:

- Deleted `node_modules` and `dist`, ran `npm install` fresh (79 packages,
  0 vulnerabilities), then `npm run build`, `npm run lint`, `npm test`
  (x3) — all clean.
- Verified the **actual production build artifact**, not just that it
  compiled: served `dist/` via `vite preview`, fetched the served
  `index.html` over real HTTP (200, correctly references the built
  asset filenames), then inspected the built JS/CSS directly on disk —
  confirmed real UI-facing strings survive minification ("Breadth-First
  Search", "Recursive Backtracker", "Manhattan distance", "How it
  works" all present in the bundle) and confirmed zero trace of the step
  9 broken-CSS-comment bug.
- Swept `src/` and `tests/` for placeholder markers (`TODO`, `FIXME`,
  `XXX`, "not implemented", "stub") — **zero found**.
- Confirmed git history: 11 commits, one per build step, clean working
  tree.
- Checked the PRD's "~40 lines per function" NFR directly rather than
  assuming it held: the six core algorithm functions (bfs/dfs/dijkstra/
  astar/randomizedDFS/randomizedPrims) are all 29-38 lines — comfortably
  inside the guideline, which is what the NFR's own pairing ("algorithm
  files should be isolated and readable independently of UI code") is
  actually about. `useSolver.ts`'s `solve` function was a real outlier at
  ~92 lines; extracted its "instant" branch into a small top-level
  helper (`buildInstantDisplay`) as a safe, mechanical, closure-free
  refactor, re-verified build/lint/test still pass after. The remainder
  is documented in that file with honest reasoning for why it stays
  longer than the guideline (animation-engine orchestration wiring two
  named closures together, not an algorithm) rather than silently
  ignored or force-fit into an artificial split.
- Bumped `package.json` version `0.0.0` → `1.0.0` — this is a complete
  deliverable now, not an unreleased scaffold.
- Final file-tree review: 54 files, matches the PRD's requested folder
  structure (`/lib/algorithms`, `/lib/mazeGen`, `/components`,
  `/lib/grid`) plus well-justified additions (`/hooks`, `/tests`,
  `/docs`, `lib/animationSpeed.ts`) — no stray files, no cruft.

### What's genuinely NOT done, and why (read this before assuming 100%)

- **No live deployed URL.** I don't have the user's GitHub or Vercel
  credentials — `README.md`'s Deploying section has exact copy-paste
  steps, this is the one deliverable only the user can complete.
- **No screenshots/GIF in the README.** No browser in this sandbox to
  capture one — flagged explicitly in the README itself, not silently
  skipped.
- **The canvas's actual rendered appearance was never seen by me,
  directly** — every UI step (5 through 9) was verified via type-checking,
  production builds, and hand-ported Visualizer-tool previews using the
  same colors/logic, never by looking at the real running app in a real
  browser, because this sandbox doesn't have one. This is the single
  biggest asterisk on "verified" throughout this build — genuinely likely
  to be fine given how much of the underlying logic *is* independently
  tested, but it is not the same thing as having looked at it.
- **NFR "≥30fps at 40×40" was never measured.** No browser means no way
  to profile actual frame rate. The rendering approach (canvas, not
  per-cell DOM nodes; Set-based O(1) overlay lookups; batched grid
  cloning once per animation frame rather than per yield) was chosen
  specifically with this requirement in mind, but "designed for" and
  "measured to hit" are different claims, and only the first one is true
  here.

---

## Decisions made across the whole build (kept for reference)

1. Tailwind v4 (Vite-native plugin, CSS-first `@theme`, not v3's config file).
2. Step-1 `App.tsx` placeholder was disclosed/labeled, not a silent stub.
3. Tests live in top-level `/tests`, not `src/tests`.
4. `.scratch/` (throwaway dev-verification scripts, steps 2-9) was
   deleted once `/tests` fully superseded it in step 10.
5. Can't push to GitHub or deploy to Vercel — no user credentials; exact
   instructions provided instead.
6. DFS's neighbor exploration order is randomized (Fisher-Yates) so its
   non-optimal wandering is actually visible, not just theoretically true
   — a fixed order could otherwise walk straight to the goal on an open
   grid and look deceptively optimal (this really happened in testing).
7. Grids are square (N×N) by default — PRD's own FR8 wording ("15×15 up
   to 40×40") always shows equal numbers.
8. Wall-drawing convention: mousedown on empty starts a "paint" drag,
   mousedown on an existing wall starts an "erase" drag — same gesture,
   decided by what's under the cursor first.
9. `MinPriorityQueue` uses lazy deletion, not decrease-key.
10. "Instant" animation speed means "skip animation, drain synchronously,"
    not "animate with a 0ms budget."
11. No explicit "Stop" button for an in-progress animation — not in the
    PRD's FRs, and grids are small enough that even "slow" finishes
    quickly.
12. `useGridEditor`'s `locked` state (added speculatively in step 5) was
    removed in step 7 in favor of one `isBusy` computed in `App.tsx` from
    the two animation engines directly — avoided three independently-owned
    lock booleans needing manual sync.
13. Comparison mode's `algorithmIdB` defaults to `"astar"` (single-mode
    default stays `"bfs"`) — an immediately-useful, different-by-default
    pairing.
14. No shared-clock abstraction was built for comparison-mode sync —
    verified (with a real test, not just assumed) that two independent
    `useSolver` instances started together stay frame-locked on their own,
    via `requestAnimationFrame`'s same-frame timestamp sharing.
15. Grid palette kept its light-background legibility convention (light =
    passable, dark = wall) rather than inverting to match the dark console
    theme — usability over total theme purity.
16. `howItWorks` (2-3 sentences) and `shortDescription` (one line) are
    separate registry fields serving different UI surfaces, not one
    string reused for both.
17. No jsdom/React Testing Library — PRD's own §11 scopes UI-interaction
    testing to a manual checklist, not automated component tests.
18. `.scratch/` was deleted outright, not archived, once superseded.
19. No screenshot/GIF in the README — disclosed gap, not a placeholder image.
20. Deploy/GitHub-push steps are written as instructions for the user,
    not claimed as done.

---

## Architecture reference (for any future work on this project)

- **Data model split**: `GridNode` (React state, in `Grid`) is structural
  only — `{row, col, type, weight}`. Algorithm run-time state (visited
  sets, distance maps, parent pointers) lives entirely inside each
  generator's own closure, never touches React state or grid cells.
- **Generator contract** — pathfinding: `function*(grid, start, end): Generator<AlgoStep, AlgoResult, void>`,
  yields `{type:"visit"|"path", row, col}`, returns
  `{visitedCount, path, pathLength}` (`path: null` if unreachable). Maze
  gen: `function*(rows, cols): Generator<Position, Grid, void>`, yields
  each carved position, returns the finished wall/empty grid (anchors
  placed separately by `placeStartAndEnd`). Both `lib/algorithms/` and
  `lib/mazeGen/` have zero React imports, by design.
- **Three consumption modes, one generator**: drain fully (instant),
  step via `requestAnimationFrame` with a time accumulator (animated), or
  step two in lockstep (comparison mode) — see `useSolver.ts`,
  `useMazeGenerator.ts`, and `ComparisonView.tsx`'s doc comments.
- **Registries as single source of truth**: `ALGORITHMS`
  (`lib/algorithms/index.ts`) and `MAZE_ALGORITHMS`
  (`lib/mazeGen/index.ts`) hold label/description/`howItWorks`/complexity
  for every dropdown, the stats panel, the "How it works" panel, and the
  viva sheet — add a fifth algorithm by adding one registry entry, not by
  hunting through component code.
- **Design system**: "Drafting Console" — dark blueprint-navy chrome
  (`#0d1b2e` console / `#15243d` panel / `#2a3d5c` border) housing a
  bright, legible grid instrument that kept its light-background
  convention on purpose. Space Grotesk (display) + IBM Plex Sans (body) +
  IBM Plex Mono (data). Signature element: `GridInstrument.tsx`'s corner
  brackets + live coordinate readout. Full color/type tokens in
  `src/index.css`'s `@theme` block and `src/components/canvasPalette.ts`.
