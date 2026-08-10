# PathVis — Demo Script (~3 minutes)

A rehearsed walkthrough so you're narrating a plan, not improvising live.
Timings are approximate — the point is the order and the beats, not
hitting each mark to the second.

## Before you start

- [ ] Have the app open full-screen in a real browser window (not a tiny
      panel) — projectors are unforgiving of small text.
- [ ] Set animation speed to **Fast**, not Instant — Instant skips the
      part that's actually the point of the demo.
- [ ] Do a silent practice run once beforehand so the timing feels natural.
- [ ] If you're worried about being asked to improvise afterward, skim
      `VIVA_CHEAT_SHEET.md` right before you go in — same content as the
      in-app "How it works" panel, so if you blank on a detail you can
      also just open that panel live and read from it.

---

## The walkthrough

### 1. Orient (0:00–0:15)

Open on the empty grid.

> "This is PathVis — it generates a random maze, then runs different
> pathfinding algorithms on it so you can watch them behave differently
> in real time, not just read about it."

### 2. Generate a maze (0:15–0:45)

Select **Randomized DFS (Recursive Backtracker)**, click **Generate maze**.

> "This carves a maze by tunneling from an already-connected room to a
> random unvisited neighbor, backtracking on dead ends — it's building a
> spanning tree over the grid as it goes, which is what guarantees the
> whole thing is solvable with no isolated pockets, before I even run a
> solver on it."

Let it finish carving. Point at the winding-corridor shape.

### 3. Run BFS (0:45–1:15)

Select **BFS**, click **Visualize**.

> "Watch it expand outward evenly, layer by layer — everything at
> distance 1, then everything at distance 2, and so on. Because it never
> skips a layer, the moment it reaches the end is guaranteed to be the
> shortest path."

Point at the green path once it resolves.

### 4. Run DFS on the *same* maze (1:15–1:45)

Click **Reset** (keeps the maze, clears the BFS result). Select **DFS**,
click **Visualize**.

> "Same exact maze, different algorithm. DFS commits to a direction and
> only backtracks when it hits a dead end — no notion of 'closer' or
> 'farther.' Watch how much more it wanders before finding *a* path — and
> it's usually a longer path than BFS's."

**Don't skip steps 2–3 and jump straight to DFS on a blank grid** — on an
open grid with no walls, DFS can look almost as direct as BFS, which
undersells the whole point. Running it on a real maze is what makes the
contrast obvious.

### 5. Comparison mode: Dijkstra vs A* on weighted terrain (1:45–2:30)

Check **Compare**. Set Algorithm A to **Dijkstra's Algorithm**, Algorithm
B to **A\* Search**. Hold Shift and click a few cells to lay down some
"mud" across a plausible route (or generate a fresh maze first and place
mud before running, if you'd rather not do it live). Click **Compare**.

> "Same maze, same start and end, both running at once, same clock —
> that's not a video trick, they're two independent runs that happen to
> land on the same animation frame every time. Dijkstra and A\* are both
> *guaranteed* to find the optimal path even with the weighted mud slowing
> some cells down — A\* just gets there having checked fewer cells, because
> its priority queue is biased toward the goal instead of expanding
> blindly in every direction."

Let both finish.

### 6. Point at the stats panel (2:30–2:50)

> "This is the actual proof, not just a claim — nodes visited, path
> length, and measured execution time, side by side. A\* visiting fewer
> nodes than Dijkstra here isn't a coincidence I'm asserting, it's a
> property I've got an automated test for."

### 7. Close (2:50–3:00)

> "Everything here — the algorithms, the maze generation, the animation
> engine — is plain generator functions and about half a dozen small
> React hooks. No framework magic. Happy to open any file and walk
> through it."

---

## If something goes wrong live

- **Maze looks boring / too easy**: click Generate maze again — it's
  randomized, a re-roll costs nothing.
- **Forgot to reset before switching algorithms**: click **Reset** (not
  **Clear grid** — Reset keeps your maze, Clear grid wipes it).
- **Asked a question you don't remember the exact answer to**: open the
  **How it works** panel live and read from it — it's the same content as
  the cheat sheet, and reading it live in the product is a perfectly fine
  answer to "how does that work?"
- **Asked "why TypeScript / why this stack"**: see the "Tech Stack" table
  in `README.md` — short, defensible reasons for each choice, not just
  "it's popular."
