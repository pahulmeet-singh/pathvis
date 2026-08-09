# PathVis — Build Progress

> **If you're Claude and the user just said "continue":** read this whole
> file silently, then resume at the top item in "Next up." Don't re-explain
> the plan back to the user — just keep building. This file is a single
> current-status snapshot, not a running log — replace whole sections in
> place when a step completes, don't append a new "Status" block on top of
> an one.

Build order (from Build_Prompt_Pathfinding_Visualizer.md), 12 steps total:
1. Project scaffold + folder structure — ✅ done
2. Grid/data model — ✅ done
3. Maze generation algorithms — ✅ done
4. Pathfinding algorithms as generator functions — ✅ done
5. Canvas rendering + grid interactions — ✅ done
6. Control panel + stats panel — ✅ done
7. Animation engine tying algorithms to the UI — ✅ done
8. Comparison mode — ✅ done
9. Styling pass — ⬅ **next**
10. Tests
11. README + viva cheat sheet + demo script
12. Final build check

**Note on the user's situation:** the person building this cannot run
`npm run dev` themselves at this stage, and I have no browser in this
sandbox. Three Visualizer-tool previews so far (static palette, live click
demo, timed animated demo) covered the visual language before this step.
Comparison mode itself didn't get a fourth preview — deliberately: it's
"the same single-run behavior, twice, side by side," not a new visual
language, so a preview would add little. **Styling (step 9, next) is
where a preview is actually worth doing again** — a real visual identity
change is exactly the kind of thing that's hard to picture from text.

---

## What's built so far

### Steps 1-7
Unchanged this step — toolchain, grid/maze/algorithm libs, canvas +
interactions, control/stats panels, the rAF-paced animation engine. All
re-verified clean this step too (see below). See git log for per-step
detail.

### Step 8: Comparison mode
- **`ComparisonView.tsx`** (new): two `GridCanvas` instances reading the
  *same* shared `grid` (PRD §3: "identical grids") — editing either one
  edits the one underlying grid both are displaying, there's no separate
  "grid A"/"grid B" to keep in sync. Each canvas gets its own
  visited/path/current overlay from its own `useSolver` instance.
- **`ComparisonStatsPanel.tsx`** (new): the actual payoff of the feature —
  nodes visited / path length / time complexity / execution time for both
  algorithms, side by side, so "A* visits fewer nodes than Dijkstra" is a
  number you can read, not a claim you take on faith.
- **`ControlPanel.tsx`**: added a "Compare" checkbox that switches
  "Algorithm" → "Algorithm A" and reveals an "Algorithm B" picker; the
  run button becomes "Compare" (label + behavior) instead of "Visualize."
- **`App.tsx`**: a *second*, fully independent `useSolver()` instance
  (`solverB`) — the hook was never written assuming it's a singleton, so
  this needed zero changes to `useSolver.ts` itself. `handleRun()` calls
  `solverA.solve(...)` and, only in comparison mode, `solverB.solve(...)`
  — both in the same synchronous event handler, both given the same
  `speed`. Layout swaps `GridCanvas`+`StatsPanel` for
  `ComparisonView`+`ComparisonStatsPanel` based on `comparisonMode`,
  reusing the same outer page structure.

### How the sync actually works (important to understand, not just trust)
Nothing new was built to "synchronize" the two runs — no shared clock
object, no coordinator. The sync is a *consequence* of how
`requestAnimationFrame` works: callbacks requested within the same
synchronous task share that upcoming frame's timestamp. Since both
`solve()` calls request their first frame in the same handler, and each
one's `tick` re-requests the next frame at the end of its own processing,
both loops keep landing in the same frames with the same `now` value on
every subsequent tick too — which means their accumulator math (delay,
elapsed time) stays identical between them for as long as both are still
running. This was a real, checkable prediction, not just a hope — see
verification below.

### Verification status
- `tsc -b`, `npm run build`, `npm run lint`: clean.
- All 6 pre-existing `.scratch/*.ts` scripts re-run — zero regressions.
- **New: `.scratch/verify-comparison-sync.ts`** — re-implements the
  accumulator pattern (as step 7's pacing test did) and drives *two*
  different real algorithms (Dijkstra and A*, on a real generated 25×25
  maze) with the identical synthetic frame-timestamp sequence. Confirmed:
  (1) frame-for-frame, both runs consume the exact same cumulative step
  count as each other for as long as both are still going — direct proof
  of the "same clock" claim above, not just a plausibility argument; (2)
  A* reliably finishes at an earlier simulated frame than Dijkstra (e.g.
  76 vs. 98 in one run) — the actual visible payoff of comparison mode,
  confirmed as a real, reproducible property rather than asserted.
  (First draft of this test had a wrong expected-value formula — fixed by
  comparing the two runs directly to each other, which is both simpler
  and the more direct statement of the property that actually matters.)

### Not started yet
Steps 9-12 (see build order above).

---

## Decisions the user should know about
*(1-12 unchanged from before, see git log on earlier commits.)*

13. **`algorithmIdB` defaults to `"astar"`** (single-mode `algorithmId`
    still defaults to `"bfs"`, unchanged) — gives an immediately-useful,
    different-by-default pairing the first time someone checks the
    Compare box, rather than comparing an algorithm against itself.
14. **No shared-clock abstraction was built.** My own step-7 architecture
    note flagged two options — reuse `useSolver` twice as-is, or build a
    proper shared clock if that didn't stay synced in practice. Verified
    (not just assumed) that the simple option works, so that's what
    shipped — see the sync explanation above.

---

## Architecture notes (for my own future-session reference)

- **For step 9 (styling pass), next:** re-read
  `/mnt/skills/public/frontend-design/SKILL.md` properly (brainstorm →
  critique → commit, per the skill's own process) rather than continuing
  with the plain-Tailwind-defaults baseline steps 5-8 deliberately stuck
  to. Also still owed from the PRD: the collapsible in-app "How it works"
  panel (§10) — this is the natural step to add it. Worth one more
  Visualizer preview afterward, showing the real visual identity rather
  than the current functional-but-generic slate/white baseline.
- Data model split, algorithm/maze-gen generator contracts, priority
  queue/BFS-queue/A*-heuristic choices, DFS neighbor shuffle,
  `isBusy`/no-separate-lock reasoning: unchanged, see earlier commits.
