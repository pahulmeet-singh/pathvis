import { describe, it, expect } from "vitest";
import {
  createEmptyGrid,
  getStart,
  getEnd,
  getNeighbors,
  setCellType,
  moveAnchor,
  countByType,
  posKey,
} from "../src/lib/grid";
import { applyMouseDown, applyMouseEnter } from "../src/lib/grid/gridEditing";

describe("createEmptyGrid", () => {
  it("creates a grid with the requested dimensions", () => {
    const grid = createEmptyGrid(10, 20);
    expect(grid.length).toBe(10);
    expect(grid[0].length).toBe(20);
  });

  it("places exactly one start and one end, on the same row, start left of end", () => {
    const grid = createEmptyGrid(10, 20);
    const start = getStart(grid);
    const end = getEnd(grid);
    expect(countByType(grid, "start")).toBe(1);
    expect(countByType(grid, "end")).toBe(1);
    expect(start.row).toBe(end.row);
    expect(start.col).toBeLessThan(end.col);
  });
});

describe("getNeighbors", () => {
  it("returns 2 neighbors for a corner cell", () => {
    const grid = createEmptyGrid(10, 10);
    expect(getNeighbors(grid, { row: 0, col: 0 })).toHaveLength(2);
  });

  it("returns 4 neighbors for an interior cell", () => {
    const grid = createEmptyGrid(10, 10);
    expect(getNeighbors(grid, { row: 5, col: 5 })).toHaveLength(4);
  });

  it("excludes wall cells from the neighbor list", () => {
    const grid = createEmptyGrid(10, 10);
    const walled = setCellType(grid, { row: 5, col: 6 }, "wall");
    const neighborKeys = getNeighbors(walled, { row: 5, col: 5 }).map(posKey);
    expect(neighborKeys).not.toContain(posKey({ row: 5, col: 6 }));
    expect(neighborKeys).toHaveLength(3);
  });
});

describe("setCellType", () => {
  it("is immutable — does not mutate the original grid", () => {
    const grid = createEmptyGrid(10, 10);
    setCellType(grid, { row: 5, col: 5 }, "wall");
    expect(grid[5][5].type).toBe("empty");
  });

  it("protects start and end cells from being overwritten", () => {
    const grid = createEmptyGrid(10, 10);
    const start = getStart(grid);
    const next = setCellType(grid, start, "wall");
    expect(next[start.row][start.col].type).toBe("start");
  });

  it("assigns extra weight to mud cells and resets weight to 1 for other types", () => {
    const grid = createEmptyGrid(10, 10);
    const muddy = setCellType(grid, { row: 3, col: 3 }, "mud");
    expect(muddy[3][3].weight).toBeGreaterThan(1);
    const backToEmpty = setCellType(muddy, { row: 3, col: 3 }, "empty");
    expect(backToEmpty[3][3].weight).toBe(1);
  });
});

describe("moveAnchor", () => {
  it("moves the start cell and clears its old position", () => {
    const grid = createEmptyGrid(10, 10);
    const start = getStart(grid);
    const target = { row: 0, col: 0 };
    const next = moveAnchor(grid, "start", target);
    expect(next[target.row][target.col].type).toBe("start");
    expect(next[start.row][start.col].type).toBe("empty");
  });

  it("refuses to move an anchor onto a wall", () => {
    const grid = createEmptyGrid(10, 10);
    const start = getStart(grid);
    const walled = setCellType(grid, { row: 1, col: 1 }, "wall");
    const next = moveAnchor(walled, "start", { row: 1, col: 1 });
    expect(next[start.row][start.col].type).toBe("start");
  });

  it("refuses to move start onto end (or vice versa)", () => {
    const grid = createEmptyGrid(10, 10);
    const start = getStart(grid);
    const end = getEnd(grid);
    const next = moveAnchor(grid, "start", end);
    expect(next[start.row][start.col].type).toBe("start");
    expect(next[end.row][end.col].type).toBe("end");
  });
});

describe("gridEditing (pure mouse-interaction rules, PRD FR2-FR4)", () => {
  it("mousedown on an empty cell begins a wall-paint drag and paints that cell", () => {
    const grid = createEmptyGrid(10, 10);
    const result = applyMouseDown(grid, { row: 2, col: 2 }, false);
    expect(result.grid[2][2].type).toBe("wall");
    expect(result.dragMode.kind).toBe("wall");
  });

  it("dragging continues painting walls into new cells", () => {
    const grid = createEmptyGrid(10, 10);
    const down = applyMouseDown(grid, { row: 2, col: 2 }, false);
    const dragged = applyMouseEnter(down.grid, { row: 2, col: 3 }, down.dragMode);
    expect(dragged[2][3].type).toBe("wall");
  });

  it("mousedown on an existing wall begins an erase drag", () => {
    const walled = setCellType(createEmptyGrid(10, 10), { row: 5, col: 5 }, "wall");
    const down = applyMouseDown(walled, { row: 5, col: 5 }, false);
    expect(down.grid[5][5].type).toBe("empty");
    expect(down.dragMode.kind).toBe("erase");
  });

  it("shift-click toggles mud on and off", () => {
    const grid = createEmptyGrid(10, 10);
    const down1 = applyMouseDown(grid, { row: 3, col: 3 }, true);
    expect(down1.grid[3][3].type).toBe("mud");
    const down2 = applyMouseDown(down1.grid, { row: 3, col: 3 }, true);
    expect(down2.grid[3][3].type).toBe("empty");
  });

  it("mousedown on start begins an anchor drag without mutating the grid", () => {
    const grid = createEmptyGrid(10, 10);
    const start = getStart(grid);
    const down = applyMouseDown(grid, start, false);
    expect(down.dragMode).toEqual({ kind: "anchor", which: "start" });
    expect(down.grid).toBe(grid);
  });

  it("dragging the start anchor onto a wall is rejected", () => {
    const grid = setCellType(createEmptyGrid(10, 10), { row: 1, col: 1 }, "wall");
    const start = getStart(grid);
    const down = applyMouseDown(grid, start, false);
    const dragged = applyMouseEnter(down.grid, { row: 1, col: 1 }, down.dragMode);
    expect(dragged[start.row][start.col].type).toBe("start");
  });
});
