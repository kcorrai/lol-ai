// Public API of the riot domain
export { connectAccount, disconnectAccount, listAccounts } from "@/domains/riot/services/accountService";
export { syncAccount } from "@/domains/riot/services/matchSyncService";
export type { ConnectedAccount } from "@/domains/riot/services/accountService";
export type { SyncResult } from "@/domains/riot/services/matchSyncService";
