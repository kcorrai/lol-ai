// Public API of the champions domain — the sanctioned entry point for other domains
// (cross-domain code imports from here, never the service files directly).
export { getChampionPool, computeMasteryScore } from "./services/championStatsService";
export type { ChampionPoolEntry, MasterySubScores } from "./services/championStatsService";
export { getChampionBaseline, MIN_BASELINE_GAMES } from "./services/championBaselineService";
export type { ChampionBaseline } from "./services/championBaselineService";
