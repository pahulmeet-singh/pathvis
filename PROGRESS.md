# PathVis — Build Progress

> **If you're Claude and the user just said "continue":** read this whole file
> silently, then resume at the top item in "Next up." Don't re-explain the
> plan back to the user — just keep building. Update this file after every
> step, before moving to the next one.

Build order (from Build_Prompt_Pathfinding_Visualizer.md), 12 steps total:
1. Project scaffold + folder structure
2. Grid/data model
3. Maze generation algorithms
4. Pathfinding algorithms as generator functions
5. Canvas rendering + grid interactions
6. Control panel + stats panel
7. Animation engine tying algorithms to the UI
8. Comparison mode
9. Styling pass
10. Tests
11. README + viva cheat sheet + demo script
12. Final build check

---

## Status: Step 2 complete ✅ (grid/data model)

### Fully done
- Vite + React 19 + TypeScript 6 project scaffolded at project root (`pathvis/`).
- Tailwind CSS v4 wired in via `@tailwindcss/vite` (no `tailwind.config.js`/
  `postcss.config.js` needed — v4 is CSS-first, see `src/index.css`).
- Path alias `@/` → `src/` configured in both `vite.config.ts` and
  `tsconfig.app.json`.
- Vitest wired into `vite.config.ts` (`test` block), scripts added
  (`npm test`, `npm run test:watch`). Test files will live in top-level
  `/tests`, using `node` environment (pure-logic tests, no DOM needed).
- `tsx` installed as a dev dependency — used for throwaway scratch
  verification scripts during development (see "Decisions" below).
- Removed default Vite template cruft (counter demo, hero image, default
  App.css).
- `npm run build` passes clean (no errors, no warnings).
- `npm run lint` (oxlint, the template's default linter) passes clean.
- **`src/lib/grid/types.ts`** — `CellType`, `Position`, `GridNode`, `Grid`,
  `GridDimensions`, `MUD_WEIGHT` constant. `GridNode` is structural only
  (row, col, type, weight) — see architecture notes below for why.
- **`src/lib/grid/gridUtils.ts`** — `createEmptyGrid`, `defaultStartEnd`,
  `cloneGrid`, `getNeighbors` (4-directional, wall-excluded, bounds-checked
  — this *is* the graph adjacency logic), `setCellType` (immutable, protects
  start/end from being painted over), `moveAnchor` (immutable, rejects
  moving onto a wall or onto the other anchor), `getStart`/`getEnd`/
  `findByType`, `countByType`, `posKey`, `gridDimensions`,
  `isWithinBounds`.
- `src/lib/grid/index.ts` barrel export.
- Verified at runtime (not just type-checked) via `.scratch/verify-grid.ts`:
  neighbor counts at corners (2) vs interior (4), wall correctly removes a
  cell from its neighbor's neighbor-list, immutability (original grid
  untouched after `setCellType`), start/end protection, anchor-move
  rejection onto walls/the other anchor. All passed.

### In progress
- Nothing mid-flight. Step 2 is a clean stopping point.

### Next up
- **Step 3: Maze generation** — `src/lib/mazeGen/mazeUtils.ts` (shared
  wall-grid + room-neighbor helpers), `randomizedDFS.ts` (recursive
  backtracker), `randomizedPrims.ts`, plus a `placeStartAndEnd` step
  decoupled from carving. See "room-grid trick" in architecture notes.
- Then step 4 (pathfinding algorithms as generators).

### Decisions made (things the user should know about)
1. **Tailwind v4, not v3.** Current stable is v4.3.x, which uses a Vite
   plugin + CSS `@theme` blocks instead of `tailwind.config.js`. Used the
   current standard, not the older v3 setup.
2. **`src/App.tsx` right now is an intentionally minimal placeholder**
   ("Scaffold OK" message) — this is NOT the "zero placeholder code" rule
   being violated, since this is the disclosed, in-progress state after
   step 1 of 12, explicitly labeled as such in a comment in the file. It
   gets replaced with the real app shell in step 5. By the time the project
   is declared *done* (step 12), nothing like this will remain.
3. **Test files live in a top-level `/tests` folder**, not `src/tests` —
   keeps the app source folder purely about the app, tests mirror it from
   outside. `tsconfig.app.json` includes both `src` and `tests` so tests get
   the same path alias and strictness, and are type-checked by `tsc -b`
   during `npm run build`.
4. **`.scratch/` is gitignored.** While building steps 2-4 (pure algorithm
   logic), quick throwaway scripts run via `npx tsx` will be used to
   sanity-check behavior *before* the formal Vitest suite is written in
   step 10, per the user's own step ordering. These scratch scripts are not
   part of the deliverable and won't ship in the final repo.
5. **GitHub/Vercel account actions**: I can (and will) keep a clean local
   git commit history the whole way through, and get the project to a
   zero-config-deployable state. I do **not** have the user's GitHub or
   Vercel credentials, so I cannot personally push to their GitHub or
   trigger a Vercel deploy under their account. At the end, I'll give exact
   copy-pasteable steps for both (this is standard — no AI tool can do this
   part without the user's own login).

---

## Architecture notes carried forward (for my own future-session reference)

- **Data model split**: `GridNode` (in `Grid`, React state) is *structural
  only* — `{ row, col, type, weight }`. No `visited`/`distance`/`previous`
  on the persisted grid. Those are per-run algorithm scratch state, live
  only inside each generator's local closures, and never touch React state
  directly. Ephemeral animation/render state (visited set, path set,
  current frontier) is separate, owned by the animation engine (step 7),
  not the grid.
- **Algorithm contract**: every algorithm in `lib/algorithms/*.ts` is
  `function*(grid, start, end): Generator<AlgoStep, AlgoResult, void>`,
  yielding `{ type: "visit", row, col }` as it processes each node, then
  `{ type: "path", row, col }` for each cell in the reconstructed path (in
  order, start→end) right before returning `AlgoResult` (visitedCount,
  path, pathLength). Zero React imports in this folder (PRD requirement).
- **Maze gen contract**: `function*(rows, cols): Generator<{row,col}, Grid, void>`,
  yields once per carved cell, returns the finished wall/empty `Grid`
  (start/end placed afterward by a separate `placeStartAndEnd` step, kept
  decoupled from the carving algorithm itself).
- **Room-grid trick** for maze gen: cells at even row/col are "rooms",
  odd row/col are "walls between rooms" — standard perfect-maze
  construction, guarantees full connectivity by construction (it's a
  spanning tree over the room-cell graph), which is what the connectivity
  unit test (PRD §11) will assert.
