export type AnimationSpeed = "instant" | "fast" | "medium" | "slow";

export const ANIMATION_SPEEDS: AnimationSpeed[] = ["instant", "fast", "medium", "slow"];

export const SPEED_LABELS: Record<AnimationSpeed, string> = {
  instant: "Instant",
  fast: "Fast",
  medium: "Medium",
  slow: "Slow",
};

/**
 * Milliseconds of real time that must accumulate before the animation
 * engine consumes the next yielded step (used by useSolver and
 * useMazeGenerator identically). 0 means "no animation": both engines
 * special-case this to a synchronous full drain instead of scheduling
 * animation frames at all, rather than scheduling frames with a 0ms
 * budget — that would still take a frame or two to visually settle,
 * where "instant" should mean the result is just there.
 */
export const SPEED_STEP_DELAY_MS: Record<AnimationSpeed, number> = {
  instant: 0,
  fast: 4,
  medium: 12,
  slow: 35,
};
