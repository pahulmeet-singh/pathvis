# PathVis — Viva Cheat Sheet

One page, everything an examiner is likely to ask about. Content here
mirrors the app's own "How it works" panel exactly (`src/lib/algorithms/index.ts`
and `src/lib/mazeGen/index.ts`) — if you say something from this sheet out
loud, it's also written down inside the product, not just in your head.

## Algorithm quick reference

| Algorithm | One-liner | Time | Space | Shortest path? |
|---|---|---|---|---|
| **BFS** | Explores everything equally, layer by layer. | O(V + E) | O(V) | Yes — unweighted only |
| **DFS** | Commits to a direction and backtracks. | O(V + E) | O(V) | No |
| **Dijkstra** | BFS generalized to weighted edges via a priority queue. | O((V + E) log V) | O(V) | Yes — weighted, non-negative |
| **A\*** | Dijkstra with a heuristic biasing search toward the goal. | O((V + E) log V) | O(V) | Yes — with an admissible heuristic |

*V = grid cells, E = edges between adjacent (non-wall) cells.*
Maze generation (both algorithms): **O(V)** — each "room" cell is carved
exactly once via O(1) amortized stack/frontier operations.

## Why A* beats Dijkstra (same answer, fewer nodes)

Both are guaranteed optimal. The difference is what order they explore in.
Dijkstra's priority is just *cost so far*. A\*'s priority is *cost so far
+ estimated cost remaining* (Manhattan distance to the goal), so a cell
that's technically cheap to reach but points away from the goal gets
deprioritized in favor of one that's pointed the right direction. The
estimate is **admissible** — it never overestimates, since the cheapest
possible step costs 1 and Manhattan distance assumes exactly that minimum
— which is the formal reason A\* is still *guaranteed* optimal and not
just "usually good."

## Why DFS isn't optimal

DFS has no notion of "closer" or "farther" — it commits to a neighbor and
keeps going until it hits a dead end, then backtracks. The first time it
reaches the goal is whatever path it happened to wander down, which can be
far longer than necessary. It's included specifically to make that
visible next to BFS/Dijkstra/A\*, not because it's a good pathfinder.

*(Demo tip: run DFS on a real maze, not a blank grid — on an open grid
with no obstacles it can walk in a nearly straight line and look
deceptively optimal. Its neighbor order is randomized in this app
specifically so the wandering/backtracking is actually visible.)*

## How maze generation guarantees solvability

Both maze algorithms build a **spanning tree** over the grid's "room"
cells (cells at even row/col — the odd row/col cells between them are the
walls that get carved through): every new room is reached by tunneling
from a room that's *already connected*, never from scratch. A spanning
tree connects every node with zero cycles, which means there's exactly
one path between any two rooms — including wherever start and end end up
— by construction, not by luck. That's also what the automated
connectivity test checks (flood-fill from the origin reaches every
carved cell, at four different grid sizes, for both algorithms).

**Randomized DFS (recursive backtracker)** always extends from the
*most recently* carved room (an explicit stack) — long, winding
corridors, few branches. **Randomized Prim's** picks the next room from
the *entire* frontier, not just the latest — shorter dead ends, more
even branching. Same guarantee, visibly different shape.

## Likely questions and tight answers

**Q: How is the graph represented — adjacency list, matrix?**
Neither. The grid itself *is* the graph — each cell's neighbors are
computed on the fly (up/down/left/right, bounds-checked, walls excluded)
rather than stored as an explicit structure. Completely standard for
grid-based pathfinding, and it's what makes the whole thing explainable as
"front-end logic operating on an in-memory 2D grid."

**Q: Why a priority queue instead of decrease-key for Dijkstra/A\*?**
Lazy deletion: push a new entry when a shorter distance is found, skip
stale entries when popped. Same O(log V) operations and the same overall
complexity as decrease-key, without needing each heap entry to track its
own index.

**Q: What happens if there's no path?**
Every algorithm's search space empties out without ever reaching the end,
so they return `path: null` instead of crashing or looping forever —
covered by an automated test, not just assumed to work.

**Q: Why does BFS ignore the weighted "mud" terrain?**
By design — BFS treats every edge as cost 1 regardless of the grid's
actual weights. That's exactly what makes it fail to find the *cheapest*
path once weights aren't uniform (it still finds *a* path, just not
necessarily the cheapest one) — which is the whole reason Dijkstra is
worth comparing it against.

**Q: How does the step-by-step animation actually work?**
Every algorithm is a generator function (`function*`) that `yield`s one
step at a time — a visited cell, then each final-path cell — instead of
computing and returning a final answer in one go. The UI calls `.next()`
on a timer instead of draining it all at once. Comparison mode runs two
of these generators started in the same event handler with the same
speed; they stay in sync because same-frame `requestAnimationFrame`
callbacks share a timestamp, not because of any explicit coordination
between them.

**Q: Why TypeScript generators specifically, instead of just returning an array of steps?**
A generator produces steps *lazily*, on demand — the algorithm's own
control flow pauses and resumes exactly where it left off, so the
animation engine doesn't need a parallel "replay" implementation that
could drift out of sync with what the algorithm actually does. It's the
same code path whether you drain it instantly or step it over ten
seconds.
