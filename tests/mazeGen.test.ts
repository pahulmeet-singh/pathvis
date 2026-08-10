import { describe, it, expect } from "vitest";
import {
  randomizedDFS,
  randomizedPrims,
  placeStartAndEnd,
  generateMazeInstantly,
  MAZE_ALGORITHMS,
} from "../src/lib/mazeGen";
import { countByType, getStart, getEnd } from "../src/lib/grid";
import type { Grid, Position } from "../src/lib/grid/types";

function drainMaze(gen: Generator<Position, Grid, void>): Grid {
  let result = gen.next();
  while (!result.done) result = gen.next();
  return result.value;
}

/** Flood-fills from `from` over non-wall cells and returns how many
 * distinct cells were reached — used to check "no isolated unreachable
 * regions" (PRD §11) by comparing this to the maze's total empty-cell
 * count: if every carved cell is reachable, they must be equal. */
function reachableCount(grid: Grid, from: Position): number {
  const rows = grid.length;
  const cols = grid[0].length;
  const seen = new Set<string>([`${from.row},${from.col}`]);
  const queue: Position[] = [from];
  let head = 0;
  const deltas: Array<[number, number]> = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  while (head < queue.length) {
    const cur = queue[head++];
    for (const [dr, dc] of deltas) {
      const nr = cur.row + dr;
      const nc = cur.col + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const key = `${nr},${nc}`;
      if (seen.has(key) || grid[nr][nc].type === "wall") continue;
      seen.add(key);
      queue.push({ row: nr, col: nc });
    }
  }
  return seen.size;
}

function countNonWall(grid: Grid): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.type !== "wall") count++;
    }
  }
  return count;
}

function expectFullyConnected(grid: Grid) {
  // Counts every non-wall cell, not just type "empty" — after
  // placeStartAndEnd runs, two carved cells become type "start"/"end"
  // rather than "empty", so "empty" alone would undercount by exactly 2
  // for an anchored maze. Counting non-wall cells is correct either way:
  // for a raw (pre-anchor) maze every non-wall cell is "empty" anyway.
  const totalPassable = countNonWall(grid);
  const reachable = reachableCount(grid, { row: 0, col: 0 });
  expect(reachable).toBe(totalPassable);
}

const SIZES: Array<[number, number]> = [
  [15, 15],
  [20, 30],
  [21, 21],
  [8, 8],
];

describe("PRD §11: randomizedDFS always produces a fully connected maze", () => {
  for (const [rows, cols] of SIZES) {
    it(`no isolated unreachable regions at ${rows}x${cols}`, () => {
      expectFullyConnected(drainMaze(randomizedDFS(rows, cols)));
    });
  }
});

describe("PRD §11: randomizedPrims always produces a fully connected maze", () => {
  for (const [rows, cols] of SIZES) {
    it(`no isolated unreachable regions at ${rows}x${cols}`, () => {
      expectFullyConnected(drainMaze(randomizedPrims(rows, cols)));
    });
  }
});

describe("placeStartAndEnd", () => {
  it("places exactly one start and one end, on non-wall cells, that differ from each other", () => {
    const grid = placeStartAndEnd(drainMaze(randomizedDFS(21, 21)));
    const start = getStart(grid);
    const end = getEnd(grid);
    expect(grid[start.row][start.col].type).toBe("start");
    expect(grid[end.row][end.col].type).toBe("end");
    expect(start).not.toEqual(end);
  });
});

describe("generateMazeInstantly", () => {
  it("produces a fully connected, anchored maze for every registered maze algorithm", () => {
    for (const algo of Object.values(MAZE_ALGORITHMS)) {
      const grid = generateMazeInstantly(algo, 20, 20);
      expectFullyConnected(grid);
      expect(countByType(grid, "start")).toBe(1);
      expect(countByType(grid, "end")).toBe(1);
    }
  });
});
