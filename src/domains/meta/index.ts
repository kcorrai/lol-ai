// Public API of the meta domain — zero-cost, patch-current champion stats.
export { getMetaSnapshot, findChampionStats, getPopularChampions } from "@/domains/meta/services/metaStatsService";
export { getCounterData } from "@/domains/meta/services/counterService";
export type { CounterMatchup, CounterResult } from "@/domains/meta/services/counterService";
export { getMatchupData } from "@/domains/meta/services/matchupService";
export type { MatchupReport } from "@/domains/meta/services/matchupService";
export { getTierList, tierLetter } from "@/domains/meta/services/tierListService";
export type { TierListEntry, RoleTierList } from "@/domains/meta/services/tierListService";
export { evaluateDraft } from "@/domains/meta/services/draftEvalService";
export type {
  DraftTeam,
  DraftSide,
  DraftChampion,
  TeamEval,
  LaneEdge,
  DraftEvaluation,
} from "@/domains/meta/services/draftEvalService";
export {
  ALL_POSITIONS,
  POSITION_LABELS,
  parsePosition,
} from "@/domains/meta/positions";
export type {
  CanonicalPosition,
  ChampionMetaStats,
  MatchupEntry,
  MetaSnapshot,
  PositionStats,
} from "@/domains/meta/types";
