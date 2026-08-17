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
