import type { PlayerPerformanceProfile } from "@/domains/analysis";
import type { AssignmentMetric, FieldAssignment, Lesson } from "@/domains/academy/types";

// Proof of Practice. A lesson's assignment is written as a movement — "0.5 more CS per
// minute" — not as an absolute target, because a Bronze player and a Diamond player
// reading the same lesson need the same instruction and different numbers. The baseline
// comes from the player's own recent games, so the target is always within reach.

export const METRIC_LABEL: Record<AssignmentMetric, string> = {
  csPerMinute: "CS / min",
  visionScore: "Vision score",
  deathsPerGame: "Deaths / game",
  killParticipation: "Kill participation",
  kda: "KDA",
};

const DECIMALS: Record<AssignmentMetric, number> = {
  csPerMinute: 1,
  visionScore: 0,
  deathsPerGame: 1,
  killParticipation: 0,
  kda: 1,
};

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** The player's current value for a metric, read off their last games. */
export function baselineFor(metric: AssignmentMetric, profile: PlayerPerformanceProfile): number {
  const m = profile.avgMetrics;
  switch (metric) {
    case "csPerMinute":
      return m.csPerMinute;
    case "deathsPerGame":
      return m.avgDeathsPerGame;
    case "killParticipation":
      return m.killParticipation;
    case "kda":
      return m.kda;
    case "visionScore":
      // avgMetrics carries vision per minute; the assignment is written in raw score,
      // which is the number a player actually sees on the end screen.
      return mean(profile.recentMatches.map((match) => match.visionScore));
  }
}

export interface AssignmentTarget {
  metric: AssignmentMetric;
  label: string;
  baseline: number;
  target: number;
  games: number;
  instruction: string;
  direction: FieldAssignment["direction"];
}

function round(value: number, metric: AssignmentMetric): number {
  const factor = 10 ** DECIMALS[metric];
  return Math.round(value * factor) / factor;
}

/**
 * Turns a lesson's assignment into a concrete target for one player. A decrease target
 * is floored at zero — "0.4 fewer deaths" cannot ask for negative deaths.
 */
export function buildAssignmentTarget(
  lesson: Lesson,
  profile: PlayerPerformanceProfile
): AssignmentTarget {
  const { metric, direction, delta, games, instruction } = lesson.assignment;
  const baseline = baselineFor(metric, profile);
  const raw = direction === "increase" ? baseline + delta : baseline - delta;

  return {
    metric,
    label: METRIC_LABEL[metric],
    baseline: round(baseline, metric),
    target: round(Math.max(raw, 0), metric),
    games,
    instruction,
    direction,
  };
}

/** Formats a metric value the way it is written everywhere in the Academy. */
export function formatMetric(value: number, metric: AssignmentMetric): string {
  const formatted = value.toFixed(DECIMALS[metric]);
  return metric === "killParticipation" ? `${formatted}%` : formatted;
}
