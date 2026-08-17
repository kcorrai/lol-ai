// Public API of the riot domain
export { connectAccount, disconnectAccount, listAccounts } from "@/domains/riot/services/accountService";
export { syncAccount, backfillMatchNicknames } from "@/domains/riot/services/matchSyncService";
export { getCurrentRank, getLpHistory, getLastRankedSnapshot } from "@/domains/riot/services/rankedService";
export { getAccountPuuid } from "@/domains/riot/services/accountLookup";
export { buildAccountPreview } from "@/domains/riot/services/previewService";
export { VALID_REGIONS } from "@/domains/riot/services/riotApiClient";
// The platform routes and their labels, so another domain can offer a region
// picker without reaching past this file into `config/`.
export { RIOT_REGION_CONFIG, RIOT_REGION_OPTIONS } from "@/domains/riot/config/regions";
export type { RiotRegion } from "@/domains/riot/config/regions";
export { indexPlayers, searchPlayers } from "@/domains/riot/services/playerIndexService";
export type { IndexablePlayer, IndexedPlayer } from "@/domains/riot/services/playerIndexService";
export type { ConnectedAccount } from "@/domains/riot/services/accountService";
export type { SyncResult } from "@/domains/riot/services/matchSyncService";
export type { CurrentRank, LpSnapshot, RankedSnapshot } from "@/domains/riot/services/rankedService";
