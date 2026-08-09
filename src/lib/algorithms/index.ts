import type { Grid, Position } from "../grid/types";
import { astar } from "./astar";
import { bfs } from "./bfs";
import { dfs } from "./dfs";
import { dijkstra } from "./dijkstra";
import type { AlgoGenerator } from "./types";

export type { AlgoFn, AlgoGenerator, AlgoResult, AlgoStep, AlgoStepType } from "./types";
export { reconstructPath } from "./pathUtils";
export { MinPriorityQueue } from "./priorityQueue";
export { astar } from "./astar";
export { bfs } from "./bfs";
export { dfs } from "./dfs";
export { dijkstra } from "./dijkstra";
export type { InstantRun } from "./runInstantly";
export { runAlgorithmInstantly } from "./runInstantly";

export type AlgorithmId = "bfs" | "dfs" | "dijkstra" | "astar";

export interface AlgorithmDef {
  id: AlgorithmId;
  label: string;
  /** One-line, viva-ready summary — PRD §7's "clean, memorized one-liner." */
  shortDescription: string;
  /** 2-3 sentence explanation for the in-app "How it works" panel (PRD
   * §10) — also doubles as the viva cheat sheet content (step 11). */
  howItWorks: string;
  guaranteesShortestPath: boolean;
  timeComplexity: string;
  spaceComplexity: string;
  run: (grid: Grid, start: Position, end: Position) => AlgoGenerator;
}

/**
 * Single source of truth for algorithm metadata — the control panel's
 * dropdown, comparison mode, the stats panel, and the generated viva sheet
 * (step 11) all read from this instead of duplicating these facts.
 */
export const ALGORITHMS: Record<AlgorithmId, AlgorithmDef> = {
  bfs: {
    id: "bfs",
    label: "BFS (Breadth-First Search)",
    shortDescription: "Explores everything equally, layer by layer.",
    howItWorks:
      "Explores the grid one layer at a time, visiting every cell at distance 1 before any cell at distance 2, and so on. Because it expands in this predictable order, the first time it reaches the end is guaranteed to be via the shortest path — as long as every step costs the same.",
    guaranteesShortestPath: true,
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)",
    run: bfs,
  },
  dfs: {
    id: "dfs",
    label: "DFS (Depth-First Search)",
    shortDescription: "Commits to a direction and backtracks — fast, not optimal.",
    howItWorks:
      "Commits to a direction and follows it as far as possible before backtracking, using a stack rather than a queue. It finds a path to the end, but has no notion of \"closer\" or \"farther\", so the path it finds is rarely the shortest one.",
    guaranteesShortestPath: false,
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)",
    run: dfs,
  },
  dijkstra: {
    id: "dijkstra",
    label: "Dijkstra's Algorithm",
    shortDescription: "BFS generalized to weighted edges via a priority queue.",
    howItWorks:
      "The same layer-by-layer idea as BFS, generalized to weighted edges: instead of a plain queue, a priority queue always expands whichever reachable cell currently has the lowest total cost so far. This is what lets it route around expensive \"mud\" terrain instead of just counting steps.",
    guaranteesShortestPath: true,
    timeComplexity: "O((V + E) log V)",
    spaceComplexity: "O(V)",
    run: dijkstra,
  },
  astar: {
    id: "astar",
    label: "A* Search",
    shortDescription: "Dijkstra with a heuristic that biases search toward the goal.",
    howItWorks:
      "Dijkstra with a hint: alongside the cost already spent, it adds an estimate of the distance still remaining (Manhattan distance to the goal), so cells pointed toward the destination get explored first. It still finds the optimal path — the estimate never overestimates — but it typically visits far fewer cells doing it.",
    guaranteesShortestPath: true,
    timeComplexity: "O((V + E) log V)",
    spaceComplexity: "O(V)",
    run: astar,
  },
};
