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
8. Comparison mode — ✅ done
9. Styling pass — ✅ done
10. Tests — ✅ done
11. README + viva cheat sheet + demo script — ⬅ **next**
12. Final build check

**Note on the user's situation:** the person building this cannot run
`npm run dev` themselves at this stage, and I have no browser in this
sandbox. Four Visualizer-tool previews so far covered every "hard to
picture from text" visual step. Step 10 was pure logic/tooling (no new
UI), so no preview was needed. Step 11 is documentation — also no preview
needed, just real files.

---

## What's built so far

### Steps 1-9
Unchanged this step. All still verified clean. See git log for detail.

### Step 10: Tests
Turned every property already checked via the (now-deleted) `.scratch/*.ts`
scripts into a real Vitest suite in top-level `/tests`, matching PRD §11:

- **`tests/grid.test.ts`** (17 tests) — grid creation/neighbors/immutable
  edits, plus the pure `gridEditing.ts` interaction rules (wall
  draw/erase, mud toggle, anchor drag + rejection cases).
- **`tests/mazeGen.test.ts`** (10 tests) — **PRD §11 requirement #1**:
  both maze algorithms produce fully connected mazes (flood-fill
  reachability == total passable cells) at 4 different sizes each,
  `placeStartAndEnd` correctness, `generateMazeInstantly` end-to-end.
- **`tests/algorithms.test.ts`** (21 tests) — **PRD §11 requirements
  #2-4**: BFS/Dijkstra path-length agreement (open grid + real maze), A*
  visited-count ≤ Dijkstra's (open grid + real maze, plus path-length
  agreement), no-path handled gracefully for all four algorithms without
  throwing. Plus general correctness (valid contiguous paths, start==end
  edge case), the mud/weighted-terrain behavioral difference test,
  `reconstructPath` edge cases, and `runAlgorithmInstantly` consistency.
- **`tests/priorityQueue.test.ts`** (4 tests) — direct heap-property tests
  for the hand-rolled `MinPriorityQueue`, including a 200-element
  randomized stress test checked against `Array.sort`.
- **`tests/animationEngine.test.ts`** (4 tests) — the accumulator pacing
  pattern (steady-frame completion, dropped-frame burst, speed
  differentiation) and the comparison-mode frame-sync property (two
  different real algorithms, driven by identical synthetic timestamps,
  checked frame-for-frame against each other).
- **`tests/MANUAL_TEST_CHECKLIST.md`** — the PRD §11 "manual test
  checklist for UI interactions" companion piece, covering exactly what
  the automated suite deliberately doesn't (DOM/React behavior — see
  decision #17 below). Organized by feature area (wall drawing, mud,
  anchors, maze gen, single-mode visualize, comparison mode, reset/clear,
  grid size, layout/accessibility), each item a single concrete action to
  perform in a running `npm run dev` session.

**56 tests, 5 files, all passing** — confirmed with `npm test`, not just
type-checked. Also stress-ran the full suite **9 times in a row** given
real randomness is involved (DFS's neighbor shuffle, the priority queue's
randomized stress test, `Math.random()`-seeded maze generation) — zero
flakiness across all 9 runs.

### A real bug caught while writing these tests
First `npm test` run: 55 passed, 1 failed — `generateMazeInstantly`
"produces a fully connected maze" reported 199 reachable cells vs. 197
expected. Root cause: my connectivity helper counted cells where
`type === "empty"`, but `generateMazeInstantly` calls `placeStartAndEnd`,
which turns exactly 2 carved cells into `type: "start"`/`"end"` — so
`countByType(grid, "empty")` undercounts by exactly 2 once anchors exist
(199 − 197 = 2, which is the tell). The earlier connectivity tests in the
same file happened to pass anyway because they test the *raw* maze before
`placeStartAndEnd` ever runs, so every passable cell really is type
"empty" there. Fixed by counting all non-wall cells instead of
specifically "empty" ones — correct for both the raw-maze and
anchored-maze cases. This was a bug in the **test**, not the app (the app
was already correct — the earlier scratch-script version of this same
check had never exercised the anchored-maze path in a way that would have
caught it).

### Verification status
- `tsc -b`, `npm run build`, `npm run lint`: clean.
- `npm test`: 56/56 passing, 5/5 files, re-run 9x with zero flakiness.
- `.scratch/` deleted — fully superseded by `/tests`, and keeping both
  around would just be two overlapping, not-quite-identical verification
  layers, which is more confusing than having one real one.

### Not started yet
Steps 11-12 (see build order above).

---

## Decisions the user should know about
*(1-16 unchanged from before, see git log on earlier commits.)*

17. **No jsdom / React Testing Library was added.** The PRD's own §11
    scopes UI-interaction testing to a *manual* checklist, not automated
    component tests — I followed that rather than substituting my own
    testing-strategy preference. Every pure-logic layer (which is
    everything that isn't literally DOM/React plumbing) is covered by
    real Vitest tests instead.
18. **`.scratch/` was deleted**, not archived. It was explicitly always
    described as throwaway (see step 2's decisions) and every property it
    checked now has a permanent home in `/tests` with more rigor
    (`expect()` assertions with real diffs on failure, not
    `console.assert` + manual exit codes).

---

## Architecture notes (for my own future-session reference)

- **For step 11, next:** README.md (architecture explanation, how to run,
  algorithms used, live link placeholder since I can't deploy on the
  user's behalf), `docs/VIVA_CHEAT_SHEET.md` (pull directly from
  `ALGORITHMS`/`MAZE_ALGORITHMS`'s `howItWorks` + the complexity table
  already in `AlgorithmDef` — don't rewrite this content a third time),
  `docs/DEMO_SCRIPT.md` (PRD §12 deliverable #5 — a rehearsed ~3-minute
  walkthrough: generate maze → run BFS → run DFS to contrast → comparison
  mode with Dijkstra vs A* on a weighted maze → point at stats). Worth
  remembering from step 4's testing: **run DFS on a maze or
  obstacle-heavy grid for the demo, not a blank open grid** — on a fully
  open grid DFS's shuffled-but-still-fairly-direct behavior is less
  visually dramatic than on a real maze with dead ends to backtrack out
  of.
- **For step 12:** final build check — run build + full test suite one
  more time after step 11's doc-only changes (shouldn't affect either,
  but confirm rather than assume), then the actual wrap-up: GitHub/Vercel
  walkthrough instructions (can't do these two myself — no user
  credentials), final snapshot.
- Data model split, algorithm/maze-gen generator contracts, priority
  queue/BFS-queue/A*-heuristic choices, DFS neighbor shuffle, animation
  accumulator pattern, console design system: unchanged, see earlier
  commits.
