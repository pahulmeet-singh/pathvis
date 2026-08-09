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
7. Animation engine tying algorithms to the UI — ✅ done
8. Comparison mode — ⬅ **next**
9. Styling pass
10. Tests
11. README + viva cheat sheet + demo script
12. Final build check

**Note on the user's situation:** the person building this cannot run
`npm run dev` themselves at this stage, and I have no browser in this
sandbox. I've been proactively using the Visualizer tool to show faithful
hand-ported previews (same colors, same algorithm logic) inline in chat —
so far: a static palette preview, a live clickable BFS demo, and (this
step) a *timed* animated BFS demo with a moving yellow frontier, matching
the real engine's visual behavior. Worth doing once more after step 9
(styling), since that's the remaining step with the highest "hard to
picture from text" payoff — comparison mode (step 8) is more naturally
explained since it's "the same single-run behavior, twice, side by side."

---

## What's built so far

### Toolchain (step 1) · `lib/grid/` (step 2) · `lib/mazeGen/` (step 3)
### `lib/algorithms/` (step 4) · canvas + interactions (step 5)
Unchanged this step — see git log on those commits for details. All still
verified clean (re-ran every `.scratch/*.ts` script this step, zero
regressions — see below).

### Step 6 → Step 7: instant reveal became real animation
Step 6 built `ControlPanel`/`StatsPanel` wired to an *instant* (all-at-once)
reveal. Step 7 replaces the mechanism underneath, not the UI contract:

- **`src/lib/animationSpeed.ts`** (new): `AnimationSpeed` type
  (`instant|fast|medium|slow`), `SPEED_STEP_DELAY_MS` (0/4/12/35ms — 0
  means "skip animation, drain synchronously," not "animate with a 0ms
  budget"), `SPEED_LABELS`. Single source of truth shared by both engines
  below, so there's exactly one speed control in the UI, not two.
- **`useSolver.ts`** (rewritten): `solve()` now takes `speed` as a
  parameter. At `instant` it still calls `runAlgorithmInstantly` directly
  (same code path step 6 verified). Otherwise it steps the *same*
  generator via `requestAnimationFrame`, using a **time accumulator**
  (not "one step per frame") so a dropped/slow frame doesn't desync the
  total animation length — verified this specific property in
  `.scratch/verify-animation-pacing.ts` (see below). Also now tracks
  `current` (the single most-recently-processed cell — the "frontier"
  highlight) and exposes `isRunning`. A `runIdRef` generation counter
  invalidates any in-flight animation when a new run starts or `reset()`
  is called, so a stale timer callback can never write into newer state.
- **`useMazeGenerator.ts`** (new hook): same accumulator/rAF pattern, but
  maze generation has a different shape — there's no separate overlay, the
  *Grid itself* is what's progressively revealed (walls → empty as carving
  proceeds). Takes `useGridEditor`'s `setGrid` directly and drives it.
  Batches all of one frame's newly-carved cells into a single grid clone
  (not one clone per yield) before calling `setGrid`.
- **`useGridEditor.ts`**: removed the `locked`/`setLocked` state added in
  step 5/speculated-on in step 6. Two animation engines both needing to
  gate editing made a *third* independently-owned lock flag a real
  liability (three booleans to keep in sync by hand). `App.tsx` now
  computes `isBusy = isRunning || isGenerating` once and passes it as
  `GridCanvas`'s `disabled` prop — which already refuses to invoke the
  mouse handlers at all when disabled, so that's sufficient; no separate
  lock needed inside the handlers themselves.
- **`GridCanvas.tsx`**: added a `current` prop (frontier highlight,
  yellow, drawn with the highest overlay priority after start/end's own
  marker). Zero other changes needed — confirms the step 5/6 design bet
  that this component wouldn't care where `visited`/`path` came from.
- **`canvasPalette.ts`** / **`Legend.tsx`**: added `frontier` color +
  legend entry — the legend now covers every PRD §10 color-legend item
  that currently exists in the app.
- **`ControlPanel.tsx`**: added the animation-speed slider (FR7 — a
  slider with 4 named positions, not a dropdown, per the PRD's literal
  wording), a `disabled` prop that freezes every control together during
  either engine's run, and button labels that switch to "Generating…" /
  "Visualizing…" while their respective engine is active.
- **`App.tsx`**: wires both engines + `speed` state (owned here, passed
  into both `solve()` and `generate()` calls) together. `isBusy` gates the
  canvas and the whole control panel as one unit.

### Verification status
- `tsc -b`, `npm run build`, `npm run lint`: clean.
- All 5 pre-existing `.scratch/*.ts` scripts re-run after this step's
  edits — zero regressions.
- **New: `.scratch/verify-animation-pacing.ts`** — since `useSolver`/
  `useMazeGenerator` need a real browser (`requestAnimationFrame`) to
  execute, this instead re-implements the exact same accumulator
  algorithm and drives it with **synthetic frame timestamps** against a
  real `bfs()` generator, so the pacing *math* is checked deterministically
  in Node. Confirmed: (1) steady 60fps frames pace out steps and the run
  finishes; (2) a large simulated time gap (tab backgrounded, then
  refocused) releases a proportional burst and finishes in ~2 frames
  instead of the ~151 steady frames it needed at normal pace — not
  stalled, not capped; (3) a smaller per-step delay consumes measurably
  more steps than a larger one for the same elapsed time (fast vs. slow
  actually differ in the right direction). This validates the *pattern*
  both hooks use; the hooks' own React/rAF plumbing is still unverified by
  me directly, for the same no-browser-in-sandbox reason as steps 5-6.
- Built a **third** Visualizer preview this step (see note above): a
  timer-paced BFS animation with a moving yellow frontier and a replay
  button, matching the real engine's behavior (flood, then trace) as
  closely as a hand port reasonably can.

### Not started yet
Steps 8-12 (see build order above).

---

## Decisions the user should know about
*(1-9 unchanged from before, see git log on earlier commits.)*

10. **"Instant" speed still means "no animation," not "animate very
    fast."** At `SPEED_STEP_DELAY_MS.instant === 0`, both engines
    short-circuit to a synchronous full drain rather than scheduling
    animation frames with a zero-length budget — the latter would still
    take a visible frame or two to resolve, where "instant" should mean
    the result is just there immediately.
11. **No explicit "Stop" button for an in-progress animation.** PRD's FRs
    don't call for one, grids are small enough (15-40 per side) that even
    "slow" runs finish well within a reasonable wait, and every control
    (including a hypothetical stop button) is disabled during a run
    anyway per the NFR about preventing inconsistent states — added
    complexity without a corresponding requirement.
12. **Removed `useGridEditor`'s `locked` state** in favor of a single
    `isBusy` computed in `App.tsx` — see the step 7 summary above for the
    reasoning (three independently-owned lock booleans vs. one).

---

## Architecture notes (for my own future-session reference)

- **For step 8 (comparison mode), next:** run two algorithms
  simultaneously on identical grids, synced to one animation clock (PRD
  §3/FR6). The natural extension: a second `useSolver()` instance (the
  hook doesn't assume it's a singleton) sharing the *same* speed and
  driven by the *same* `requestAnimationFrame` callback timing — needs
  either (a) lifting the tick-scheduling one level up so one rAF loop
  steps two generators in lockstep, or (b) two independent `useSolver`
  instances started in the same synchronous event handler, which — given
  they use the same `delay` and both start their first rAF request in the
  same tick — should already stay visually synced without further work,
  since rAF callbacks queued in the same frame fire together. Try (b)
  first (simpler, reuses useSolver unchanged); only build the shared-clock
  version in (a) if (b) turns out not to stay synced in practice.
  `GridCanvas` will need a second `visited`/`path`/`current` prop set or a
  side-by-side pair of instances — probably the latter, matching PRD's own
  "ComparisonView (two GridCanvas instances synced to one animation
  clock)" architecture note.
- **For step 9 (styling pass):** re-read
  `/mnt/skills/public/frontend-design/SKILL.md`. Still owed: the
  collapsible in-app "How it works" panel (PRD §10).
- Data model split, algorithm/maze-gen generator contracts, priority
  queue/BFS-queue/A*-heuristic choices, DFS neighbor shuffle: unchanged,
  see step 4 commit.
