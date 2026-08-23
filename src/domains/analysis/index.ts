// Public API of the analysis domain — the sanctioned entry point for other
// domains (CLAUDE.md §4). Deliberately narrow: only what another domain has a
// reason to call belongs here.

export { awardXp } from "./services/challengeProgressService";
export { XP_PER_LEVEL } from "./services/challengeConstants";

// The Academy places a player and picks their next lesson from these two (LA-21).
export { getPlayerPerformanceProfile } from "./services/matchAnalysisService";
export { getActiveHabits } from "./services/habitDetectionService";
export type { DetectedHabit, HabitSeverity } from "./services/habitDetectionService";
export type { PlayerPerformanceProfile, PerformanceMetrics } from "./types/analysis.types";

// The public profile builds a scoreboard straight from a Riot DTO, so the riot domain needs the
// same two formulas the stored path uses — anything else and the same match would print two
// different damage shares depending on whether the viewer was signed in.
export {
  computeDamageShare,
  computeKillParticipation,
} from "./calculators/performanceCalculator";

// The public profile reads a searched player's averages against their own tier — the one thing
// on that page op.gg does not have, and the reason it can end in a coaching CTA (LA-69).
export { getBenchmarkForTier } from "./services/rankBenchmarkService";
export type { RankBenchmarks } from "@/domains/coaching/types/coaching.types";

// The career card is built from the same timeline /timeline renders, so the coaching
// domain needs a sanctioned way in (LA-37).
export { getCareerTimeline } from "./services/careerTimelineService";
export type {
  CareerTimeline,
  CareerSummary,
  CareerBand,
  CareerEvent,
} from "./services/careerTimeline.types";
