import { describe, it, expect } from "vitest";
import { bfs, dfs, dijkstra, astar, ALGORITHMS, runAlgorithmInstantly, reconstructPath } from "../src/lib/algorithms";
import { createEmptyGrid, getStart, getEnd, MUD_WEIGHT } from "../src/lib/grid";
import { randomizedDFS, placeStartAndEnd } from "../src/lib/mazeGen";
import type { Grid, GridNode, Position, CellType } from "../src/lib/grid/types";

function drain<T, R>(gen: Generator<T, R, void>): R {
  let result = gen.next();
  while (!result.done) result = gen.next();
  return result.value;
}

function drainMaze(gen: Generator<Position, Grid, void>): Grid {
  return drain(gen);
}

function isValidPath(grid: Grid, path: Position[], start: Position, end: Position): boolean {
  if (path.length === 0) return false;
  if (path[0].row !== start.row || path[0].col !== start.col) return false;
  const last = path[path.length - 1];
  if (last.row !== end.row || last.col !== end.col) return false;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    if (Math.abs(a.row - b.row) + Math.abs(a.col - b.col) !== 1) return false;
    if (grid[b.row][b.col].type === "wall") return false;
  }
  return true;
}

function sealOffEnd(grid: Grid): Grid {
  const end = getEnd(grid);
  const rows = grid.length;
  const cols = grid[0].length;
  const deltas: Array<[number, number]> = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  let sealed = grid;
  for (const [dr, dc] of deltas) {
    const r = end.row + dr;
    const c = end.col + dc;
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      sealed = sealed.map((row, ri) =>
        ri === r ? row.map((cell, ci) => (ci === c ? { ...cell, type: "wall" as const, weight: 1 } : cell)) : row,
      );
    }
  }
  return sealed;
}

describe("PRD §11: BFS and Dijkstra agree on path length when all weights are 1", () => {
  it("returns the same path length on an open, unweighted grid", () => {
    const grid = createEmptyGrid(20, 20);
    const start = getStart(grid);
    const end = getEnd(grid);
    const bfsResult = drain(bfs(grid, start, end));
    const dijkstraResult = drain(dijkstra(grid, start, end));
    expect(bfsResult.path).not.toBeNull();
    expect(dijkstraResult.path).not.toBeNull();
    expect(bfsResult.pathLength).toBe(dijkstraResult.pathLength);
  });

  it("still agrees on a real generated maze", () => {
    const grid = placeStartAndEnd(drainMaze(randomizedDFS(25, 25)));
    const start = getStart(grid);
    const end = getEnd(grid);
    const bfsResult = drain(bfs(grid, start, end));
    const dijkstraResult = drain(dijkstra(grid, start, end));
    expect(bfsResult.pathLength).toBe(dijkstraResult.pathLength);
  });
});

describe("PRD §11: A* visits <= nodes visited by Dijkstra on the same maze", () => {
  it("holds on an open grid, and both agree on the optimal path length", () => {
    const grid = createEmptyGrid(25, 25);
    const start = getStart(grid);
    const end = getEnd(grid);
    const dijkstraResult = drain(dijkstra(grid, start, end));
    const astarResult = drain(astar(grid, start, end));
    expect(astarResult.visitedCount).toBeLessThanOrEqual(dijkstraResult.visitedCount);
    expect(astarResult.pathLength).toBe(dijkstraResult.pathLength);
  });

  it("holds on a real generated maze", () => {
    const grid = placeStartAndEnd(drainMaze(randomizedDFS(25, 25)));
    const start = getStart(grid);
    const end = getEnd(grid);
    const dijkstraResult = drain(dijkstra(grid, start, end));
    const astarResult = drain(astar(grid, start, end));
    expect(astarResult.visitedCount).toBeLessThanOrEqual(dijkstraResult.visitedCount);
  });
});

describe("PRD §11: no-path case is handled gracefully", () => {
  for (const [id, algo] of Object.entries(ALGORITHMS)) {
    it(`${id} returns path: null and pathLength: 0, without throwing, when the end is sealed off`, () => {
      const grid = sealOffEnd(createEmptyGrid(10, 10));
      const start = getStart(grid);
      const end = getEnd(grid);
      const result = drain(algo.run(grid, start, end));
      expect(result.path).toBeNull();
      expect(result.pathLength).toBe(0);
    });
  }
});

describe("General pathfinding correctness (all four algorithms)", () => {
  const grid = createEmptyGrid(15, 15);
  const start = getStart(grid);
  const end = getEnd(grid);

  for (const [id, algo] of Object.entries(ALGORITHMS)) {
    it(`${id} finds a valid, contiguous path on an open grid`, () => {
      const result = drain(algo.run(grid, start, end));
      expect(result.path).not.toBeNull();
      expect(isValidPath(grid, result.path as Position[], start, end)).toBe(true);
    });

    it(`${id} returns a length-1 path when start === end`, () => {
      const result = drain(algo.run(grid, start, start));
      expect(result.path).toEqual([start]);
      expect(result.pathLength).toBe(1);
    });
  }
});

describe("Weighted terrain (mud): Dijkstra/A* respect it, BFS ignores it", () => {
  it("Dijkstra and A* take a cheaper detour around mud; BFS takes the direct-but-costlier route", () => {
    const rows = 3;
    const cols = 5;
    const grid: Grid = [];
    for (let r = 0; r < rows; r++) {
      const row: GridNode[] = [];
      for (let c = 0; c < cols; c++) {
        let type: CellType = "empty";
        if (r === 1 && c === 0) type = "start";
        else if (r === 1 && c === 4) type = "end";
        row.push({ row: r, col: c, type, weight: 1 });
      }
      grid.push(row);
    }
    grid[1][2] = { ...grid[1][2], type: "mud", weight: MUD_WEIGHT };

    const start: Position = { row: 1, col: 0 };
    const end: Position = { row: 1, col: 4 };

    function pathCost(path: Position[]): number {
      let cost = 0;
      for (let i = 1; i < path.length; i++) cost += grid[path[i].row][path[i].col].weight;
      return cost;
    }

    const bfsResult = drain(bfs(grid, start, end));
    const dijkstraResult = drain(dijkstra(grid, start, end));
    const astarResult = drain(astar(grid, start, end));

    const bfsCost = pathCost(bfsResult.path as Position[]);
    const dijkstraCost = pathCost(dijkstraResult.path as Position[]);
    const astarCost = pathCost(astarResult.path as Position[]);

    expect(dijkstraCost).toBeLessThan(bfsCost);
    expect(astarCost).toBe(dijkstraCost);
  });
});

describe("reconstructPath", () => {
  it("returns a length-1 path when start equals end", () => {
    const point: Position = { row: 4, col: 4 };
    expect(reconstructPath(new Map(), point, point)).toEqual([point]);
  });

  it("returns an empty array if the chain never reaches start (fails safe, doesn't throw or loop forever)", () => {
    const cameFrom = new Map<string, Position>();
    const start: Position = { row: 0, col: 0 };
    const end: Position = { row: 5, col: 5 };
    // no entries recorded — end is unreachable via this (empty) cameFrom map
    expect(reconstructPath(cameFrom, start, end)).toEqual([]);
  });
});

describe("runAlgorithmInstantly", () => {
  it("matches the underlying generator's own final counts exactly", () => {
    const grid = createEmptyGrid(20, 20);
    const start = getStart(grid);
    const end = getEnd(grid);
    const run = runAlgorithmInstantly(ALGORITHMS.bfs, grid, start, end);
    expect(run.visited).toHaveLength(run.visitedCount);
    expect(run.path).toHaveLength(run.pathLength);
    expect(run.pathFound).toBe(true);
  });
});

describe("dfs", () => {
  it("still finds a valid path across several runs despite its randomized neighbor order", () => {
    const grid = placeStartAndEnd(drainMaze(randomizedDFS(20, 20)));
    const start = getStart(grid);
    const end = getEnd(grid);
    for (let i = 0; i < 10; i++) {
      const result = drain(dfs(grid, start, end));
      expect(result.path).not.toBeNull();
      expect(isValidPath(grid, result.path as Position[], start, end)).toBe(true);
    }
  });
});
