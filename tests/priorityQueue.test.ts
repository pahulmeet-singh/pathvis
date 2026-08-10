import { describe, it, expect } from "vitest";
import { MinPriorityQueue } from "../src/lib/algorithms";

describe("MinPriorityQueue", () => {
  it("pops values in ascending priority order regardless of push order", () => {
    const pq = new MinPriorityQueue<string>();
    pq.push("c", 3);
    pq.push("a", 1);
    pq.push("e", 5);
    pq.push("b", 2);
    pq.push("d", 4);

    const order: string[] = [];
    while (pq.size > 0) order.push(pq.pop() as string);

    expect(order).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("pop returns undefined when empty, and size tracks correctly", () => {
    const pq = new MinPriorityQueue<number>();
    expect(pq.size).toBe(0);
    expect(pq.pop()).toBeUndefined();
    pq.push(1, 1);
    expect(pq.size).toBe(1);
  });

  it("handles duplicate priorities without losing entries", () => {
    const pq = new MinPriorityQueue<string>();
    pq.push("x", 1);
    pq.push("y", 1);
    pq.push("z", 1);
    expect(pq.size).toBe(3);
    const popped = new Set([pq.pop(), pq.pop(), pq.pop()]);
    expect(popped).toEqual(new Set(["x", "y", "z"]));
  });

  it("maintains the heap property under a larger randomized sequence", () => {
    const pq = new MinPriorityQueue<number>();
    const values = Array.from({ length: 200 }, () => Math.floor(Math.random() * 1000));
    for (const v of values) pq.push(v, v);

    const popped: number[] = [];
    while (pq.size > 0) popped.push(pq.pop() as number);

    const sorted = [...values].sort((a, b) => a - b);
    expect(popped).toEqual(sorted);
  });
});
