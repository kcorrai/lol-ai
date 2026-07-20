// Public API of the riot domain
export { connectAccount, disconnectAccount, listAccounts } from "@/domains/riot/services/accountService";
export { syncAccount, backfillMatchNicknames } from "@/domains/riot/services/matchSyncService";
export { getCurrentRank, getLpHistory, getLastRankedSnapshot } from "@/domains/riot/services/rankedService";
export { getAccountPuuid } from "@/domains/riot/services/accountLookup";
export type { ConnectedAccount } from "@/domains/riot/services/accountService";
export type { SyncResult } from "@/domains/riot/services/matchSyncService";
export type { CurrentRank, LpSnapshot, RankedSnapshot } from "@/domains/riot/services/rankedService";
