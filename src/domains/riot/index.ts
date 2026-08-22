// Public API of the riot domain
export { connectAccount, disconnectAccount, listAccounts } from "@/domains/riot/services/accountService";
export { syncAccount, backfillMatchNicknames } from "@/domains/riot/services/matchSyncService";
export { getCurrentRank, getLpHistory, getLastRankedSnapshot } from "@/domains/riot/services/rankedService";
export { getAccountPuuid } from "@/domains/riot/services/accountLookup";
export { buildAccountPreview } from "@/domains/riot/services/previewService";
// The marketplace asks whether a student is in a game right now, for a coach
// who is about to spectate them (LA-19).
export { getLiveDraft, getLiveDraftForRiotId } from "@/domains/riot/services/liveGameService";
export type { LiveDraft, LiveGameResult } from "@/domains/riot/services/liveGameService";
export { VALID_REGIONS } from "@/domains/riot/services/riotApiClient";
export { indexPlayers, searchPlayers } from "@/domains/riot/services/playerIndexService";
export type { IndexablePlayer, IndexedPlayer } from "@/domains/riot/services/playerIndexService";
export type { ConnectedAccount } from "@/domains/riot/services/accountService";
export type { SyncResult } from "@/domains/riot/services/matchSyncService";
export type { CurrentRank, LpSnapshot, RankedSnapshot } from "@/domains/riot/services/rankedService";
// The Discord bot's /match card. Deeper than the preview's recent-match list,
// which carries no CS, damage or items.
export { getLastMatchSummary } from "@/domains/riot/services/lastMatchService";
export type { LastMatchSummary, LastMatchPlayer } from "@/domains/riot/services/lastMatchService";
