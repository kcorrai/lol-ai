// Public API of the riot domain
export {
  connectAccount,
  disconnectAccount,
  listAccounts,
} from "@/domains/riot/services/accountService";
export { syncAccount, backfillMatchNicknames } from "@/domains/riot/services/matchSyncService";
// The durable entry the sync routes use: it owns `syncStatus` as well as the pull, so a
// caller cannot leave an account marked RUNNING after a failure. The desktop companion
// reports a finished game through it (ADR-038 phase 5).
export { runSyncWithStatus } from "@/domains/riot/services/matchSyncService";
export {
  getCurrentRank,
  getLpHistory,
  getLastRankedSnapshot,
} from "@/domains/riot/services/rankedService";
export { getAccountPuuid } from "@/domains/riot/services/accountLookup";
export { buildAccountPreview } from "@/domains/riot/services/previewService";
// The public profile page's superset: the same rows plus each match's ten-player scoreboard and
// the account's mastery (LA-69).
export { buildPublicProfile } from "@/domains/riot/services/previewService";
export { buildPublicMatchPage } from "@/domains/riot/services/preview/previewPage";
// The marketplace asks whether a student is in a game right now, for a coach
// who is about to spectate them (LA-19).
export { getLiveDraft, getLiveDraftForRiotId } from "@/domains/riot/services/liveGameService";
// The public live page's payload: the same lobby, plus who the ten players are, how they rank and
// what the draft says (LA-70).
export { buildLiveScout } from "@/domains/riot/services/liveScoutService";
export type {
  LiveScout,
  LiveScoutPlayer,
  LiveScoutResult,
} from "@/domains/riot/services/liveScout.types";
export type { LiveDraft, LiveGameResult } from "@/domains/riot/services/liveGameService";
export { VALID_REGIONS } from "@/domains/riot/services/riotApiClient";
export { indexPlayers, searchPlayers } from "@/domains/riot/services/playerIndexService";
export type { IndexablePlayer, IndexedPlayer } from "@/domains/riot/services/playerIndexService";
export type { ConnectedAccount } from "@/domains/riot/services/accountService";
export type { SyncResult } from "@/domains/riot/services/matchSyncService";
export type {
  CurrentRank,
  LpSnapshot,
  RankedSnapshot,
} from "@/domains/riot/services/rankedService";
// The Discord bot's /match card. Deeper than the preview's recent-match list,
// which carries no CS, damage or items.
export { getLastMatchSummary } from "@/domains/riot/services/lastMatchService";
export type { LastMatchSummary, LastMatchPlayer } from "@/domains/riot/services/lastMatchService";
