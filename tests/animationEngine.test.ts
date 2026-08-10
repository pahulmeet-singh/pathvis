import { describe, it, expect } from "vitest";
import { bfs, dijkstra, astar } from "../src/lib/algorithms";
import { createEmptyGrid, getStart, getEnd } from "../src/lib/grid";
import { randomizedDFS, placeStartAndEnd } from "../src/lib/mazeGen";
import { SPEED_STEP_DELAY_MS } from "../src/lib/animationSpeed";
import type { Grid } from "../src/lib/grid/types";

/**
 * `useSolver`/`useMazeGenerator` drive a generator with this exact
 * accumulator pattern via `requestAnimationFrame`, which needs a real
 * browser — not available in Vitest's `node` test environment. This
 * re-implements the same algorithm and drives it with synthetic frame
 * timestamps instead, so the pacing *math* — the part most likely to
 * carry a subtle bug — is checked deterministically.
 */
function simulateAnimation<T, R>(
  gen: Generator<T, R, void>,
  delay: number,
  frameTimestamps: number[],
): { cumulativeSteps: number[]; finishedAtFrame: number | null } {
  let lastFrameTime = frameTimestamps[0] ?? 0;
  let accumulated = 0;
  let total = 0;
  const cumulativeSteps: number[] = [];
  let finishedAtFrame: number | null = null;

  for (let f = 0; f < frameTimestamps.length; f++) {
    const now = frameTimestamps[f];
    accumulated += now - lastFrameTime;
    lastFrameTime = now;

    while (accumulated >= delay) {
      accumulated -= delay;
      const step = gen.next();
      if (step.done) {
        finishedAtFrame = f;
        cumulativeSteps.push(total);
        return { cumulativeSteps, finishedAtFrame };
      }
      total++;
    }
    cumulativeSteps.push(total);
  }
  return { cumulativeSteps, finishedAtFrame };
}

function sixtyFpsFrames(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * 16.7);
}

function freshMaze(): Grid {
  const gen = randomizedDFS(25, 25);
  let r = gen.next();
  while (!r.done) r = gen.next();
  return placeStartAndEnd(r.value);
}

describe("animation accumulator pacing", () => {
  it("finishes within a reasonable number of frames at steady 60fps", () => {
    const grid = createEmptyGrid(20, 20);
    const result = simulateAnimation(
      bfs(grid, getStart(grid), getEnd(grid)),
      SPEED_STEP_DELAY_MS.medium,
      sixtyFpsFrames(400),
    );
    expect(result.finishedAtFrame).not.toBeNull();
  });

  it("releases a proportional burst after a large dropped-frame gap instead of stalling", () => {
    const grid = createEmptyGrid(20, 20);
    const gen = bfs(grid, getStart(grid), getEnd(grid));
    // A ~5s gap between frame 0 and frame 1 (e.g. a backgrounded tab
    // regaining focus) should release enough budget to finish this run —
    // which only needs a few hundred steps — well before frame 2.
    const frames = [16.7, 5000, 5016.7];
    const result = simulateAnimation(gen, 10, frames);
    expect(result.finishedAtFrame).toBe(1);
  });

  it("a smaller per-step delay consumes more steps than a larger one over the same elapsed time", () => {
    const gridA = createEmptyGrid(20, 20);
    const gridB = createEmptyGrid(20, 20);
    const frames = sixtyFpsFrames(50);
    const fast = simulateAnimation(bfs(gridA, getStart(gridA), getEnd(gridA)), SPEED_STEP_DELAY_MS.fast, frames);
    const slow = simulateAnimation(bfs(gridB, getStart(gridB), getEnd(gridB)), SPEED_STEP_DELAY_MS.slow, frames);
    const fastTotal = fast.cumulativeSteps[fast.cumulativeSteps.length - 1];
    const slowTotal = slow.cumulativeSteps[slow.cumulativeSteps.length - 1];
    expect(fastTotal).toBeGreaterThan(slowTotal);
  });
});

describe("comparison mode: two runs sharing the same frame clock stay in lockstep (PRD FR6)", () => {
  it("Dijkstra and A* consume identical step counts frame-for-frame until one finishes, and A* finishes no later", () => {
    const maze = freshMaze();
    const start = getStart(maze);
    const end = getEnd(maze);
    const delay = SPEED_STEP_DELAY_MS.fast;
    const frames = sixtyFpsFrames(500);

    const dijkstraRun = simulateAnimation(dijkstra(maze, start, end), delay, frames);
    const astarRun = simulateAnimation(astar(maze, start, end), delay, frames);

    const commonFrames = Math.min(
      dijkstraRun.finishedAtFrame ?? frames.length,
      astarRun.finishedAtFrame ?? frames.length,
    );
    for (let f = 0; f < commonFrames; f++) {
      expect(astarRun.cumulativeSteps[f]).toBe(dijkstraRun.cumulativeSteps[f]);
    }

    expect(dijkstraRun.finishedAtFrame).not.toBeNull();
    expect(astarRun.finishedAtFrame).not.toBeNull();
    expect(astarRun.finishedAtFrame as number).toBeLessThanOrEqual(dijkstraRun.finishedAtFrame as number);
  });
});
