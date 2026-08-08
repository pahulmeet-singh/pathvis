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
    guaranteesShortestPath: true,
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)",
    run: bfs,
  },
  dfs: {
    id: "dfs",
    label: "DFS (Depth-First Search)",
    shortDescription: "Commits to a direction and backtracks — fast, not optimal.",
    guaranteesShortestPath: false,
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)",
    run: dfs,
  },
  dijkstra: {
    id: "dijkstra",
    label: "Dijkstra's Algorithm",
    shortDescription: "BFS generalized to weighted edges via a priority queue.",
    guaranteesShortestPath: true,
    timeComplexity: "O((V + E) log V)",
    spaceComplexity: "O(V)",
    run: dijkstra,
  },
  astar: {
    id: "astar",
    label: "A* Search",
    shortDescription: "Dijkstra with a heuristic that biases search toward the goal.",
    guaranteesShortestPath: true,
    timeComplexity: "O((V + E) log V)",
    spaceComplexity: "O(V)",
    run: astar,
  },
};
