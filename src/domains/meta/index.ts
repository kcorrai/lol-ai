// Public API of the meta domain — zero-cost, patch-current champion stats.
export { getMetaSnapshot, findChampionStats } from "@/domains/meta/services/metaStatsService";
export { getCounterData } from "@/domains/meta/services/counterService";
export type { CounterMatchup, CounterResult } from "@/domains/meta/services/counterService";
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
