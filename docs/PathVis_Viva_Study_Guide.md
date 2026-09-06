# PathVis — Deep Study Guide

This goes well past the one-page cheat sheet already in the repo
(`docs/VIVA_CHEAT_SHEET.md`). That one is for the last five minutes before
you walk in. This one is for actually understanding the material, so that
when an examiner asks a follow-up you weren't expecting, you can reason
your way to the answer instead of hoping it's on the sheet.

**How to use this**: don't memorize sentences. For each algorithm, be
able to (1) explain the mechanism to a friend with no notes, (2) explain
*why* its guarantee holds — not just that it does, (3) derive the
complexity rather than recite it, (4) point to the actual line of code
that implements the idea. If you can do all four for BFS, the other three
algorithms take a fraction of the effort, because Dijkstra is BFS-plus-one-idea
and A* is Dijkstra-plus-one-idea.

---

## Part 1 — The graph, made explicit

Before any algorithm makes sense, be precise about what graph you're
actually running them on.

- **Vertices (V)**: every non-wall cell in the grid.
- **Edges (E)**: an edge exists between two vertices if they are
  orthogonally adjacent (share a side) and neither is a wall. No
  diagonals. Every edge is undirected — if you can walk A→B you can walk
  B→A.
- **Weights**: every edge has weight 1, *except* an edge is more
  expensive to enter a "mud" cell — cost is attached to the **destination**
  cell, not the source. This convention matters: it's why a mud *start*
  cell doesn't penalize anything (you never "enter" your own start).
- **Degree**: every vertex has degree ≤ 4 (up/down/left/right), and
  exactly 2, 3, or 4 depending on whether it's a corner, edge, or
  interior cell of the open region.

**Why this representation (implicit, not an adjacency list/matrix)?**
An adjacency list would need O(V+E) memory allocated and populated up
front. An adjacency matrix would need O(V²) — for a 40×40 grid that's
1600² = 2.56 million cells, almost all storing "no edge," for a graph
that only actually has on the order of 2×V real edges. Computing
neighbors on the fly costs O(1) extra memory per query and is trivial to
compute (four bounds-checks) — the standard, correct choice for
grid graphs specifically. This is a legitimate design trade-off to be
able to name, not just a shortcut: an adjacency list *would* be better if
edge weights were irregular/sparse in a non-grid graph, or if you needed
O(1) "does this edge exist" lookups without recomputation. For a 4-connected
grid, implicit computation wins on every axis.

---

## Part 2 — BFS

### Mechanism
A FIFO queue. Start goes in. Repeat: dequeue the front, if it's the
goal stop, otherwise enqueue every unvisited neighbor (marking each
"seen" *at enqueue time*, not dequeue time, so a cell can't be queued
twice).

### Why it's guaranteed shortest (proof sketch, not just assertion)
Think of the search in **layers**: layer 0 is `{start}`, layer *d* is
every vertex whose shortest-edge-count from start is exactly *d*. Claim:
BFS dequeues every layer-*d* vertex before any layer-(*d*+1) vertex.

Proof by induction on *d*. Base case *d*=0 trivially holds (only start is
in the queue initially). Inductive step: assume every layer-≤*d* vertex
is dequeued before any layer-(*d*+1) vertex. When a layer-*d* vertex is
dequeued, its neighbors are either layer-(*d*-1) (already seen, skipped),
layer-*d* (already seen or about to be — either way, harmless), or
layer-(*d*+1) (newly discovered, enqueued *now*). Because the queue is
FIFO and every layer-*d* vertex got enqueued strictly before any
layer-(*d*+1) vertex (by the inductive hypothesis applied one level
down), every layer-(*d*+1) discovery happens only after all layer-*d*
vertices are already in the queue ahead of it. So the FIFO order forces
all layer-*d* dequeues to finish before the first layer-(*d*+1) dequeue.

Consequence: the *first* time you dequeue the goal, you're seeing it at
the smallest *d* for which it's reachable — the definition of shortest
path (in edge count).

**This proof is exactly why BFS breaks the moment edges have different
costs** — "layer" stops meaning "distance" once a 2-edge path can cost
more than a 5-edge path.

### Complexity
- **Time**: every vertex is enqueued once and dequeued once → O(V). Every
  edge is examined exactly twice (once from each endpoint, when that
  endpoint is dequeued) → O(E). Total: **O(V + E)**.
- **Space**: the queue holds at most O(V) entries at once (worst case,
  one full layer); the `seen` set and `cameFrom` map are each O(V). Total:
  **O(V)**.

### In the code (`src/lib/algorithms/bfs.ts`)
- The queue is a plain array with a `head` index pointer, not
  `.shift()` — `.shift()` is O(n) per call (it has to re-index every
  remaining element), so using it in a loop would make BFS accidentally
  O(V²). The index-pointer trick keeps dequeue O(1) amortized.
- `seen` is marked at *enqueue* time (`if (!seen.has(key)) { seen.add(key); queue.push(...) }`),
  which is what prevents the same cell from being queued from two
  different neighbors before either has been processed.

---

## Part 3 — DFS

### Mechanism
Same shape as BFS, but a stack (LIFO) instead of a queue. Push start.
Repeat: pop the top, if visited skip it, else mark visited, check if
goal, else push all unvisited neighbors.

### Why it's *not* guaranteed shortest
There's no proof to write here — the point is there's no property being
maintained that *would* force shortest paths. DFS commits to whichever
neighbor it pushed last (since stack = LIFO) and rides that choice as far
as it can before backtracking. The path it eventually finds is whatever
sequence of commitments got it to the goal, which has no relationship to
edge-count-minimality.

**Concrete counterexample worth having ready**: picture a straight
2-cell-wide corridor from start to end, plus one long winding detour
loop that also reaches the end. If DFS's neighbor order happens to push
the detour direction last (so it gets popped first), it walks the entire
detour before ever trying the direct corridor.

**A precision worth having ready, since it's easy to get caught out
on**: that counterexample needs a graph with an actual loop in it (two
distinct routes to choose between). A *generated maze* in this project
has no loops — it's a spanning tree (Part 6), so there is exactly one
possible path between any two points. On a generated maze specifically,
DFS's *final path length* is forced to tie with every other algorithm's,
since there's no alternate route for it to have found instead. This was
confirmed directly, not assumed: on one real 30×30 test maze, all four
algorithms returned the identical 141-cell path (project report, Chapter
7.2). The property that *does* still hold, and is what the app's demo
actually shows, is nodes visited: DFS visited 317 cells finding that
path, versus 203 for BFS — real wandering, just not reflected in the
final path's length on this specific kind of input. If asked to defend
"DFS isn't optimal" against a demo where its path length matched BFS's
exactly, this is the precise, correct answer: the guarantee that's
missing is about the *search process*, and path-length parity on a tree
graph is a property of the *input*, not evidence that DFS became
optimal.

### Why THIS implementation shuffles neighbor order
Worth knowing as a specific, defensible implementation decision: with a
*fixed* neighbor order (say, always try up/down/left/right in that exact
sequence), DFS on a fully open grid can walk in a straight line to the
goal with zero backtracking, if that fixed order happens to favor the
goal's direction — which makes it look deceptively optimal in a demo,
even though the property "DFS isn't optimal" is still formally true. The
neighbor list is shuffled (Fisher-Yates) before pushing specifically so
the wandering/backtracking behavior is *visible*, not just theoretically
present. This doesn't change DFS's definition or correctness in any way —
visitation order was never part of DFS's definition to begin with.

### Complexity
Same **O(V + E)** time, **O(V)** space as BFS — the shape of the work is
identical, only the data structure (and therefore the order) differs.

### In the code (`src/lib/algorithms/dfs.ts`)
Notice `visited` is checked/marked at *pop* time here, not push time
(the opposite of BFS's enqueue-time marking) — meaning a cell genuinely
can sit in the stack more than once before it's actually processed. This
is normal and harmless for a simple explicit-stack DFS: duplicate entries
just get skipped via the `if (visited.has(key)) continue;` check when
they're eventually popped a second time.

---

## Part 4 — Dijkstra's Algorithm

### Mechanism
A priority queue (min-heap) instead of a plain queue, keyed by **distance
so far** (`g(n)`). Pop the minimum; if it's already finalized, it's a
stale entry — skip it. Otherwise finalize it, and for each neighbor,
compute `candidateDist = g(current) + weight(neighbor)`; if that beats
the neighbor's best known distance, update it and push the neighbor with
its new priority.

### Why the greedy choice is safe (this is the actual heart of Dijkstra)
When you pop the minimum-distance vertex from the frontier, could there
be a *cheaper* way to reach it that you haven't discovered yet? No — and
here's why: any other path to it would have to pass through some other
frontier vertex first (everything already-finalized is, by definition,
not on any better path, or it would already have been finalized via that
route). But every OTHER frontier vertex has distance ≥ the one you just
popped (that's what "minimum" means). And since **all edge weights are
non-negative**, continuing past that other frontier vertex can only add
*more* cost, never subtract it. So no path through any other frontier
vertex can beat the one you just finalized. That's the entire correctness
argument, and it's *exactly* the step that breaks with negative edges —
a negative edge later in the graph could retroactively make a
currently-more-expensive path cheaper, which is precisely the case
Dijkstra's greedy finalization can't handle (and why Bellman-Ford exists:
it re-relaxes every edge V-1 times instead of finalizing greedily, which
costs O(VE) but tolerates negative weights).

### Complexity
Each vertex is popped (and finalized) once: **O(V)** pops. Each edge can
trigger at most one push (when it improves a neighbor's distance): up to
**O(E)** pushes. Each heap push/pop is **O(log V)** (heap height, since
the heap holds at most O(V) live entries at once with lazy deletion).
Total: **O((V + E) log V)**.

### Lazy deletion — why, and how
A binary heap supports push and pop-min efficiently, but *decreasing an
arbitrary existing entry's key* is awkward — you'd need to know that
entry's index in the heap array and re-bubble it, which means every
entry needs to track its own position, and that position changes on
every swap. The workaround: don't bother. When a shorter distance is
found, just push a *new* entry — the heap can have multiple entries for
the same vertex, that's fine. When popping, check a `finalized` set
first; if the popped vertex is already finalized, it's a stale leftover
from before its distance was improved — just discard it and pop again.
Same O(log V) per operation, same overall O((V+E) log V), no per-entry
index bookkeeping needed.

### In the code (`src/lib/algorithms/dijkstra.ts`)
`finalized` plays the role BFS's `seen` plays, but it's named
differently on purpose — once popped here, a vertex's distance is
*provably* final (that's the greedy-choice argument above), which is a
stronger claim than "we've seen it."

---

## Part 5 — A* Search

### Mechanism
Identical to Dijkstra, except the priority queue is keyed by
`f(n) = g(n) + h(n)` instead of just `g(n)`, where `h(n)` is an estimate
of the remaining cost to the goal (Manhattan distance here).

### Admissibility — the property that makes it still correct
A heuristic is **admissible** if `h(n) ≤` the true cheapest remaining
cost, for every vertex *n*. Manhattan distance is admissible on this
grid: the true cheapest possible cost of any single step is 1 (mud costs
*more*, never less), and Manhattan distance is exactly "how many steps
if every step cost the minimum possible" — so it can only ever
under-estimate, never over-estimate.

Why admissibility preserves optimality (intuition, not full formal
proof): if `h` never overestimates, then `f(n) = g(n) + h(n)` never
overestimates the true cost of the cheapest path through *n*. So A*
never prioritizes a vertex whose true best-case total cost is worse than
the actual optimal path's cost highly enough to expand it *before* it
would have found the optimum — the estimate can only make it *less*
eager to explore paths that turn out to be too expensive, never eager
enough to miss the real answer.

**Consistency** (worth mentioning if asked "is it just admissible, or
more?"): Manhattan distance is also *consistent* — for every edge
(n, n'), `h(n) ≤ cost(n,n') + h(n')`. This is the triangle inequality,
and it holds automatically for Manhattan distance on a grid. Consistency
is what guarantees A* never needs to re-open a finalized vertex — same
guarantee Dijkstra gets from non-negative weights, extended to account
for the heuristic.

### Why it visits fewer nodes (not just "it does")
Dijkstra treats every frontier vertex as equally interesting regardless
of direction — it explores in a widening circle. A*'s `f(n)` penalizes
vertices that are technically cheap-so-far but geometrically pointed away
from the goal, so they sit *behind* goal-ward vertices in the priority
queue and often never get popped at all before the goal is found. The
heuristic doesn't change *what* the algorithm is allowed to explore —
it changes the *order*, and a better order means stopping sooner.

### If the heuristic weren't admissible (a real curveball)
A* would still terminate and still return *a* path, but it could return
a **suboptimal** one — an overestimating heuristic can cause A* to
commit to a "looks cheap" route and finalize the goal before a genuinely
cheaper alternative has been given a fair chance to be explored. This is
also, not coincidentally, the entire idea behind *Greedy Best-First
Search* (one of the PRD's listed stretch goals, not implemented here):
it uses `f(n) = h(n)` alone, ignoring `g(n)` completely — fast, but with
no optimality guarantee at all, since it has zero mechanism to reconsider
a path once it looks locally promising.

### Complexity
Same asymptotic bound as Dijkstra — **O((V + E) log V)**. The heuristic
changes the *practical* number of vertices explored, not the worst-case
bound (a maximally unhelpful admissible heuristic, like `h(n) = 0`
everywhere, makes A* degrade exactly to Dijkstra).

---

## Part 6 — Maze Generation

### The spanning tree argument, precisely
A spanning tree of a graph is a subgraph that (a) touches every vertex,
(b) is connected, (c) has exactly |V|−1 edges (equivalently: has no
cycles). A tree has a **unique** path between any two vertices — if there
were two different paths between the same pair, tracing both would trace
out a cycle, contradicting "no cycles."

Both maze algorithms build a spanning tree over the "room" cells
(cells at even row/col — the room-lattice trick) by construction: every
carve operation connects exactly one new, previously-unconnected room to
the existing connected structure via exactly one new edge. That's
literally the definition of incremental spanning-tree construction. So:
every room ends up connected (property (b) — nothing is ever carved
*except* from an already-connected room), and there's exactly one path
between any two rooms (the unique-path property of trees) — including
whichever two rooms end up as start and end. Solvability isn't tested
for after the fact; it's structurally guaranteed by how the maze is
built.

### A unifying framing worth having (this is a genuinely strong point to make)
Both algorithms are instances of the same general strategy, sometimes
called the "growing tree algorithm" in maze-generation literature: maintain
a set of "frontier" cells adjacent to the growing tree, repeatedly pick
one, connect it in, add its new neighbors to the frontier. The *only*
difference between the two implementations here is the **selection
rule** for which frontier cell to pick next:

- **Randomized DFS (recursive backtracker)**: always pick the
  *most recently added* frontier cell (implemented as a stack) → long,
  low-branching corridors, since it keeps extending the same thread
  until forced to backtrack.
- **Randomized Prim's**: pick *uniformly at random* from the *entire*
  frontier → shorter dead ends, more even branching, since any
  in-progress thread is equally likely to get extended as any other.

Naming it this way — "same algorithm family, one parameter changed" —
tends to land well in a viva, because it shows the *why* behind the
visual difference rather than just describing that a difference exists.
(It's also why "Randomized Prim's" is a fair name: real Prim's-for-MST
picks the *minimum-weight* frontier edge; this picks a *uniformly random*
one — same frontier-growth skeleton, different selection rule, which is
exactly the kind of substitution the "randomized" in the name is
signaling.)

### Complexity
Each room is carved exactly once. Each carve does O(1) amortized work
(a stack push/pop for recursive backtracker; a frontier-list operation
for Prim's — technically O(frontier size) for the random pick + splice in
this implementation, but the frontier is bounded by O(V) and each cell
enters/leaves it O(1) times overall). Practically: **O(V)** for both.

---

## Part 7 — Data Structures, standalone

### The binary min-heap (`MinPriorityQueue`)
Array-backed, 0-indexed, standard layout: for index *i*, parent is at
`⌊(i−1)/2⌋`, children are at `2i+1` and `2i+2`. Two operations:

- **Push**: append to the end of the array, then "bubble up" — repeatedly
  compare to the parent and swap if the new entry is smaller, until
  either the parent is smaller or you reach the root. Cost: **O(log n)**,
  bounded by the tree's height.
- **Pop**: the minimum is always at index 0 (the heap invariant). Take
  the last element, move it to index 0, then "bubble down" — repeatedly
  swap with the smaller of its two children until it's smaller than both
  or it has no children. Cost: **O(log n)**.

Why array-based rather than a linked tree of nodes: no pointer/object
overhead per node, better cache locality (adjacent heap levels are
physically near each other in memory), and the index arithmetic replaces
what would otherwise be parent/child pointer traversal. The heap stays
*complete* (every level full except possibly the last, filled
left-to-right) by construction — that completeness is exactly what
guarantees O(log n) height for n elements, rather than a height that
could degrade toward O(n) the way an unbalanced binary search tree can.

### Generators (`function*`, `yield`)
A generator function doesn't run when called — calling it returns an
iterator object, and none of the function body executes until `.next()`
is called on that iterator. Each `.next()` call runs the function body
until the next `yield`, returns `{value, done: false}`, and *pauses* —
every local variable's state is preserved exactly as it was. The next
`.next()` call resumes from that exact point. When the function finally
`return`s, the iterator produces `{value: <the return value>, done: true}`.

This is what lets one algorithm implementation serve three completely
different consumption patterns with zero duplicated logic: drain it in a
tight `while (!done)` loop for an instant result, call `.next()` once per
animation frame for an animated reveal, or run two generators side by
side calling `.next()` on each from the same clock for synced comparison
mode. The algorithm's own control flow *is* the animation driver — there
is no separate "replay" implementation of the algorithm that could drift
out of sync with the real one, because there's only ever one
implementation, consumed at different speeds.

---

## Part 8 — System Design (for "why did you build it this way" questions)

- **Why `requestAnimationFrame` + a time accumulator, not `setInterval`**:
  `requestAnimationFrame` syncs to the browser's actual paint cycle (no
  wasted work rendering faster than the screen can show it) and
  automatically pauses when the tab isn't visible. A *fixed* "one step
  per frame" would tie animation speed to frame rate — the accumulator
  (`accumulated += elapsed; while (accumulated >= delay) { step; accumulated -= delay; }`)
  decouples them, and specifically survives a long dropped-frame gap (tab
  backgrounded, then refocused) by releasing a proportional burst of
  steps instead of either stalling or silently skipping progress.
- **Why comparison mode needs no explicit shared clock**: two independent
  `requestAnimationFrame` calls requested within the same synchronous
  event handler get queued for the *same upcoming browser frame*, and
  every frame after that stays aligned too, since each side re-requests
  its own next frame at the end of processing the current one. It's a
  consequence of how the browser schedules frames, not something the
  code coordinates explicitly — verified with a test that drives two real
  algorithms with identical synthetic frame timestamps and checks they
  consume identical step counts frame-for-frame.
- **Why the Grid stored in React state carries no algorithm state**
  (no `visited`/`distance`/`previous` fields on the actual grid cells):
  keeping the persisted grid purely structural (wall/mud/start/end) means
  the exact same grid object can be handed to two simultaneous algorithm
  runs (comparison mode) without them corrupting each other's
  bookkeeping — each generator keeps its own visited-set/distance-map/
  parent-map entirely in its own local closure.

---

## Part 9 — Curveball questions (beyond the cheat sheet's core six)

**Q: Why not Bellman-Ford instead of Dijkstra?**
Bellman-Ford handles negative edge weights (which Dijkstra cannot,
because its correctness relies on the greedy-finalization argument in
Part 4, which only holds for non-negative weights) by relaxing every
edge V−1 times, at O(VE) — strictly worse than Dijkstra's
O((V+E) log V) on a graph where Dijkstra even applies. Since mud only
ever makes an edge *more* expensive, never negative, there's no reason
to pay Bellman-Ford's cost here.

**Q: What if two priority-queue entries have equal priority?**
Nothing breaks — the heap doesn't guarantee any particular tie-breaking
order, and neither Dijkstra's nor A*'s correctness depends on one. Either
could be popped first; both are still valid frontier expansions at that
distance.

**Q: Could the generated maze ever contain a cycle?**
No — by construction (Part 6), it's a spanning tree, and a tree has zero
cycles by definition. A cycle would require two different paths between
some pair of rooms, which can't happen if every room was connected via
exactly one new edge from the already-connected structure.

**Q: What's the actual space breakdown for Dijkstra/A*, precisely?**
Three O(V)-sized structures: the `dist` map (distance-so-far per
visited-or-discovered vertex), the `cameFrom` map (parent pointers, for
path reconstruction), and the `finalized` set. The priority queue itself
is bounded by O(V) *live* entries at steady state, though with lazy
deletion it can transiently hold more (stale duplicates) — still O(V)
overall since each vertex triggers at most O(degree) = O(4) = O(1)
pushes.

**Q: How would you add diagonal movement?**
Extend the neighbor-delta list from 4 directions to 8, and switch the A*
heuristic from Manhattan distance (which assumes only orthogonal moves)
to Chebyshev or Euclidean distance — Manhattan distance would *overestimate*
true cost once diagonal moves are allowed (a diagonal move covers more
Euclidean ground per step than Manhattan distance credits it for),
breaking admissibility.

**Q: How would you extend this to a weighted A* variant (bounded suboptimal, faster)?**
Multiply the heuristic by a constant `ε > 1`: `f(n) = g(n) + ε·h(n)`.
This makes the search more aggressively goal-directed (faster, visits
fewer nodes) at the cost of a bounded-suboptimality guarantee instead of
a strict-optimality one (the returned path is guaranteed to be at most
`ε` times the optimal cost). Not implemented here, but a natural
extension question.

**Q: Why is DFS still guaranteed to terminate, if it's not guaranteed
optimal?**
The `visited` set ensures no cell is ever processed twice, and the grid
is finite — so the stack can only ever hold a bounded number of
not-yet-processed pushes before it empties out. Termination and
optimality are independent properties; DFS has the first without the
second.

**Q: What's the actual difference between Randomized Prim's here and
real MST-Prim's?**
Real Prim's-for-MST picks the *minimum-weight* edge crossing the
frontier at each step, to build a *minimum* spanning tree. This maze
generator picks a *uniformly random* frontier cell instead — it still
builds *a* spanning tree (any selection rule does, as long as you always
connect from the existing structure), just not a minimum-weight one,
because there's no notion of "weight" being minimized here — the goal is
an interesting-looking maze, not an optimal one.

---
