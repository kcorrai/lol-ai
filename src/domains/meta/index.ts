// Public API of the meta domain — zero-cost, patch-current champion stats.
export { getMetaSnapshot, findChampionStats, getPopularChampions } from "@/domains/meta/services/metaStatsService";
export {
  getChampionDetail,
  getChampionCounters,
  getChampionBuild,
} from "@/domains/meta/services/championDetailService";
export type { ChampionDetail } from "@/domains/meta/services/championDetailService";
export type { SnapshotMode, SnapshotTier } from "@/domains/meta/services/opggShared";
export { getCounterData } from "@/domains/meta/services/counterService";
export type { CounterMatchup, CounterResult } from "@/domains/meta/services/counterService";
export { getMatchupData } from "@/domains/meta/services/matchupService";
export type { MatchupReport } from "@/domains/meta/services/matchupService";
export {
  matchupSlug,
  parseMatchupSlug,
  getMatchupPairs,
} from "@/domains/meta/services/matchupPairsService";
export { getTierList, getAramTierList, tierLetter } from "@/domains/meta/services/tierListService";
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
  POSITION_SLUG,
  parsePosition,
} from "@/domains/meta/positions";
export { formatGamePatch, gamePatchSlug } from "@/lib/lolPatch";
export type {
  CanonicalPosition,
  ChampionMetaStats,
  MatchupEntry,
  MetaSnapshot,
  PositionStats,
  ChampionBuild,
  RuneBuild,
  BuildItemSet,
  GameLengthPoint,
  PatchTrendPoint,
} from "@/domains/meta/types";
