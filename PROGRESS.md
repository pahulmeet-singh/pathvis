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
6. Control panel + stats panel — ⬅ **next**
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
config), Vitest wired in (`npm test`), path alias `@/` → `src/`.
`npm run build` and `npm run lint` (oxlint) both pass clean throughout —
re-verified after every step, not just at the end.

### `src/lib/grid/` (step 2, + gridEditing.ts added in step 5)
- `types.ts`: `CellType`, `Position`, `GridNode` (structural only), `Grid`, `MUD_WEIGHT`.
- `gridUtils.ts`: creation, cloning, neighbors, immutable cell/anchor edits.
- `gridEditing.ts` **(new, step 5)**: `applyMouseDown` / `applyMouseEnter` —
  pure (zero React/DOM) decision logic for what a mousedown/drag on a given
  cell means (grab anchor / toggle mud / draw wall / erase wall). This is
  deliberately separated from the canvas component so the interaction
  rules are testable without a browser — see verification below.
- Runtime-verified: `.scratch/verify-grid.ts`, `.scratch/verify-grid-editing.ts`.

### `src/lib/mazeGen/` (step 3) — unchanged, see prior entries in git log.
### `src/lib/algorithms/` (step 4) — unchanged, see prior entries in git log.

### `src/components/`, `src/hooks/` (step 5, new)
- **`canvasPalette.ts`**: cell-type → color map used as canvas `fillStyle`
  values (canvas can't resolve CSS vars). Explicitly marked as a *working
  baseline* — real design-token decisions happen in step 9, not here.
- **`GridCanvas.tsx`**: HTML5 Canvas grid renderer (PRD §4 tech-stack
  requirement) + raw mouse-to-cell coordinate translation. Responsive
  (ResizeObserver-driven cell sizing, clamped 10-32px, capped canvas
  height so tall/narrow grids don't overflow), devicePixelRatio-aware
  (crisp on retina). Start = filled circle, end = diamond — different
  *shapes*, not just colors, so the two are distinguishable without
  relying on color perception. Deliberately has zero knowledge of what a
  click *means* — it only reports `(cell, modifierHeld)` up to its caller.
- **`useGridEditor.ts`**: the hook that owns `Grid` state and wires
  GridCanvas's raw mouse callbacks to `gridEditing.ts`'s pure rules;
  exposes `resize`, `clearWalls`, and a `locked` flag for the animation
  engine (step 7) to freeze editing during a run, per the PRD's UI/UX
  requirement. Global `window` mouseup listener releases a drag even if
  the pointer leaves the canvas before release.
- **`App.tsx`**: real (not placeholder) step-5 shell — header + the wired
  grid, with a one-line interaction hint since there's no control panel
  yet to explain the controls. Control/stats panels are step 6, not stubs
  here.

### Verification status for step 5 (read this carefully)
- `tsc -b`, `npm run build`, `npm run lint`: all clean.
- **The interaction *logic* is runtime-verified** (`.scratch/verify-grid-editing.ts`,
  7 scenarios: wall draw+drag, erase+drag, mud toggle, start drag, end
  drag, anchor-onto-wall rejection, anchor-onto-anchor rejection) — all
  passed, with zero DOM/browser needed since this logic is pure.
- **The canvas rendering itself is NOT visually confirmed.** This sandbox
  has no real browser / screenshot capability, so I cannot see the actual
  pixels GridCanvas produces — only that the code type-checks, builds,
  and (by code review) implements the drawing logic correctly. Per PRD
  §11, UI-interaction verification is scoped to a **manual checklist**
  (not automated component tests) — that checklist gets written in step
  10, but the honest status right now is: **please run `npm run dev`
  yourself on this snapshot** to confirm the grid actually looks and
  drags the way it's supposed to. If anything looks off, tell me and I'll
  fix it before continuing — much cheaper to catch now than after steps
  6-9 build on top of it.

### Not started yet
Everything from step 6 onward (see build order above).

---

## Decisions the user should know about
1. **Tailwind v4, Tests in top-level `/tests`, `.scratch/` gitignored,
   GitHub/Vercel needs the user's own credentials** — unchanged from
   before, see git log on earlier commits for the original reasoning.
2. **DFS's neighbor order is shuffled** (step 4) — unchanged, see git log.
3. **Grids are square (N×N) by default going forward.** PRD FR8 says
   "adjust grid size (e.g., 15×15 up to 40×40)" — always shown as equal
   numbers, which reads as one "size" control rather than independent
   row/col controls. `useGridEditor.resize(rows, cols)` stays fully
   general underneath (doesn't hard-code square), but the step 6 UI will
   expose it as a single slider calling `resize(n, n)`. Default grid is
   25×25.
4. **Wall-drawing UX**: mousedown on an empty cell starts a "paint walls"
   drag; mousedown on an existing wall starts an "erase" drag instead —
   so the same click-drag gesture does both, decided by what you click
   first. This is the same convention most pathfinding visualizers use
   and wasn't specified explicitly in the PRD, so documenting the choice
   here rather than treating it as obvious.
5. **Canvas visual output is unverified by me** — see the verification
   section above. This is a real, disclosed gap, not swept under the rug.

---

## Architecture notes (for my own future-session reference)

- **Data model split**: `GridNode` (React state) is structural-only.
  Algorithm run-time state lives in generator closures, never on grid
  cells — lets comparison mode (step 8) run two algorithms on one grid
  safely.
- **For step 6 (control panel + stats panel), next:** needs (a) maze
  algorithm dropdown reading `MAZE_ALGORITHMS` (lib/mazeGen), (b)
  pathfinding algorithm dropdown reading `ALGORITHMS` (lib/algorithms),
  (c) grid-size slider calling `resize(n, n)` from `useGridEditor`, (d)
  speed slider (state only for now — actually used by step 7's animation
  engine), (e) Generate Maze / Visualize / Reset / Clear buttons, (f)
  stats panel showing visitedCount/pathLength/execution time — but there's
  no run result to show until step 7 exists, so stats panel likely renders
  its "empty" state honestly in step 6 and gets real data wired in step 7.
  Both panels should read `algo.label`/`algo.shortDescription` etc. from
  the registries (step 3/4's `index.ts` files) rather than duplicating
  algorithm facts as literal strings in component code.
- **For step 7 (animation engine):** this is where per-run ephemeral
  render state (visited-in-order list, path set, current frontier cell)
  finally gets designed and wired into GridCanvas as new optional props —
  GridCanvas's props interface was deliberately left open for this
  (nothing to refactor, just extend).
- **Frontend design direction for step 9**: re-read
  `/mnt/skills/public/frontend-design/SKILL.md` before that pass. Current
  step 5/6 styling (light slate page, white header, functional canvas
  palette) is intentionally a plain working baseline, not a design
  decision to defend later — steps 6-8 should keep using plain Tailwind
  defaults too rather than accreting one-off style choices, so step 9 is a
  clean, deliberate pass rather than a patch-over-patches cleanup.
- **Priority queue**: lazy deletion. **BFS queue**: array + head index.
  **A\* heuristic**: Manhattan distance, admissible even with mud.
