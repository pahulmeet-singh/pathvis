# Manual Test Checklist — UI Interactions

Per the PRD (§11), UI interaction testing is scoped to manual verification
rather than automated component tests — the automated Vitest suite
(`/tests`) covers every pure-logic property (grid editing rules, maze
connectivity, algorithm correctness, animation pacing); this checklist
covers the DOM/browser behavior on top of that logic, which the project
deliberately doesn't spin up jsdom/React Testing Library to test
automatically (see `PROGRESS.md` decisions for the reasoning).

Run through this after any change that touches `GridCanvas.tsx`,
`useGridEditor.ts`, `useSolver.ts`, `useMazeGenerator.ts`, or the
components in `src/components/`. Each item should be a single manual
action in a running `npm run dev` session.

## Wall drawing

- [ ] Click a single empty cell — it becomes a wall.
- [ ] Click-and-drag across several empty cells — all of them become walls.
- [ ] Click an existing wall — it clears back to empty.
- [ ] Click-and-drag starting on a wall — drags through empty cells too;
      all become empty (erase mode), not walls.
- [ ] Start a wall-drag, drag the mouse outside the grid, release outside,
      then move the mouse back over the grid without pressing the button —
      nothing paints (the drag correctly ended on mouse-up even though it
      happened outside the canvas).

## Mud (weighted terrain)

- [ ] Hold Shift and click an empty cell — it becomes mud (amber).
- [ ] Hold Shift and click that same mud cell again — it toggles back to empty.
- [ ] Hold Shift and drag across several empty cells — all become mud.

## Start / end anchors

- [ ] Click-and-drag the start marker to a new empty cell — it moves, old
      cell becomes empty, marker keeps its circular shape.
- [ ] Click-and-drag the end marker to a new empty cell — it moves, marker
      keeps its diamond shape.
- [ ] Try dragging start onto a wall cell — rejected, start stays put.
- [ ] Try dragging start directly onto the end cell — rejected, both stay
      where they were.

## Maze generation

- [ ] Select "Randomized DFS", click Generate maze — a maze appears with
      long winding corridors.
- [ ] Select "Randomized Prim's", click Generate maze — a visibly
      different, more branching maze appears.
- [ ] While maze generation is animating, confirm every control panel
      input is disabled (grayed out, not clickable).
- [ ] After generation finishes, controls re-enable.

## Visualize (single mode)

- [ ] Run each of BFS, DFS, Dijkstra, A* on the same maze — confirm the
      animation visibly differs between them (DFS should look like it
      wanders/backtracks, not just walk straight to the goal).
- [ ] Watch the yellow "frontier" cell move as the animation plays — it
      should track the single most-recently-processed cell.
- [ ] Confirm the final path highlights in green after the visited flood
      finishes, tracing from start to end.
- [ ] Change animation speed to "Instant" and re-run — the result appears
      immediately, no animation.
- [ ] Change animation speed to "Slow" and re-run — visibly slower than
      "Fast".
- [ ] Generate a maze with a mud patch (or place mud manually), run BFS
      then Dijkstra — confirm their paths actually differ where mud is
      involved (BFS goes straight through, Dijkstra detours).

## Comparison mode

- [ ] Check the "Compare" box — a second algorithm dropdown ("Algorithm
      B") appears, and two grids render side by side.
- [ ] Pick two different algorithms (e.g. Dijkstra vs A*), click Compare —
      both grids animate visibly in sync (same pace, same frontier
      movement timing).
- [ ] Confirm the faster-converging algorithm (typically A*) visibly
      finishes before the other one, rather than both finishing
      simultaneously regardless of algorithm.
- [ ] Draw a wall on either grid while in comparison mode — confirm it
      appears on both grids (they share one underlying grid).
- [ ] Confirm the stats panel shows both algorithms' numbers side by side
      (columns "A" / "B") after a Compare run.

## Reset / Clear / editing during a run

- [ ] After a Visualize run, click Reset — the visited/path overlay and
      stats clear, but walls/mud/start/end stay exactly as they were.
- [ ] Click Clear grid — walls and mud disappear, a fresh empty grid
      appears (start/end reset to default positions).
- [ ] Run Visualize, then (after it finishes) draw a new wall — confirm
      the previous run's stats/overlay clear automatically rather than
      showing a stale result next to a grid that's since changed.
- [ ] Start a Visualize run and, while it's still animating, try clicking
      any control panel button or drawing on the grid — everything should
      be inert until the run finishes.

## Grid size

- [ ] Drag the grid-size slider to a smaller value — grid shrinks, cells
      get visually larger (or stay within the max cell size cap).
- [ ] Drag it to the maximum (40) — grid still renders legibly, no
      overflow or broken layout.
- [ ] Confirm resizing clears any previous run's stats/overlay and any
      walls that were drawn (a resize is a fresh grid).

## Layout & accessibility

- [ ] Narrow the browser window to roughly a phone width — layout stacks
      to a single column (grid on top, controls below) without anything
      overlapping or overflowing horizontally.
- [ ] Tab through the control panel using only the keyboard — every
      control (dropdowns, buttons, sliders, the Compare checkbox) gets a
      visible cyan focus ring, in a sensible order.
- [ ] Open "How it works" via mouse click, then close it — confirm it's
      also operable with keyboard alone (Tab to it, Enter/Space to
      toggle), since it's a native `<details>` element.
- [ ] Hover the mouse over the grid — a coordinate readout ("row, col")
      appears in the corner and updates as the mouse moves; it disappears
      when the mouse leaves the grid.
