// Public API of the meta domain — zero-cost, patch-current champion stats.
export { getMetaSnapshot, findChampionStats } from "@/domains/meta/services/metaStatsService";
export type {
  CanonicalPosition,
  ChampionMetaStats,
  MatchupEntry,
  MetaSnapshot,
  PositionStats,
} from "@/domains/meta/types";
