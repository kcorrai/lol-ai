import type { SessionGoalMetric } from "@prisma/client";

// How each session goal is read off one game, and whether the game hit it.
// Pure, so the rule a student is measured against is tested on its own.

export interface GameLine {
  kills: number;
  deaths: number;
  assists: number;
  csPerMinute: number;
  visionScore: number;
  durationSeconds: number;
}

interface MetricRule {
  label: string;
  unit: string;
  /** "min" means the game must reach the target; "max" means it must stay under it. */
  direction: "min" | "max";
  /** Bounds a coach may set, so a typo cannot make a goal nobody can ever meet. */
  range: [number, number];
  read: (game: GameLine) => number;
}

export const GOAL_METRICS: Record<SessionGoalMetric, MetricRule> = {
  CS_PER_MIN: {
    label: "CS per minute",
    unit: "cs/min",
    direction: "min",
    range: [1, 12],
    read: (g) => g.csPerMinute,
  },
  DEATHS: {
    label: "Deaths per game",
    unit: "deaths",
    direction: "max",
    range: [0, 15],
    read: (g) => g.deaths,
  },
  VISION_PER_MIN: {
    label: "Vision score per minute",
    unit: "vision/min",
    direction: "min",
    range: [0.2, 5],
    read: (g) => (g.durationSeconds > 0 ? g.visionScore / (g.durationSeconds / 60) : 0),
  },
  KDA: {
    label: "KDA",
    unit: "KDA",
    direction: "min",
    range: [0.5, 15],
    read: (g) => (g.kills + g.assists) / Math.max(g.deaths, 1),
  },
};

/** The game's value for this metric, rounded to what the page prints. */
export function metricValue(metric: SessionGoalMetric, game: GameLine): number {
  return Math.round(GOAL_METRICS[metric].read(game) * 100) / 100;
}

/** Whether a game met the goal. Compares the printed value, so the tick and the number agree. */
export function metGoal(metric: SessionGoalMetric, target: number, game: GameLine): boolean {
  const value = metricValue(metric, game);
  return GOAL_METRICS[metric].direction === "min" ? value >= target : value <= target;
}

/** Whether a coach's target is inside the metric's sane range. */
export function validTarget(metric: SessionGoalMetric, target: number): boolean {
  const [lo, hi] = GOAL_METRICS[metric].range;
  return Number.isFinite(target) && target >= lo && target <= hi;
}
