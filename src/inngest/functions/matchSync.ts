import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { syncAccount } from "@/domains/riot/services/matchSyncService";

export interface MatchSyncPayload {
  riotAccountId: string;
  userId: string;
}

// Wraps the synchronous syncAccount() function in a durable Inngest worker.
// Concurrency key ensures only one sync runs per account at a time.
export const matchSyncWorker = inngest.createFunction(
  {
    id: "match-sync-worker",
    triggers: [{ event: "riot/sync.requested" }],
    concurrency: { limit: 1, key: "event.data.riotAccountId" },
    retries: 2,
  },
  async ({ event }) => {
    const { riotAccountId } = event.data as MatchSyncPayload;

    await prisma.riotAccount.update({
      where: { id: riotAccountId },
      data: {
        syncStatus: "RUNNING",
        syncStartedAt: new Date(),
        lastSyncError: null,
      },
    });

    try {
      const result = await syncAccount(riotAccountId, true);

      await prisma.riotAccount.update({
        where: { id: riotAccountId },
        data: {
          syncStatus: "COMPLETED",
          syncCompletedAt: new Date(),
        },
      });

      logger.info(`[matchSync] Sync completed for ${riotAccountId}: +${result.newMatches} matches`);
      return { status: "completed", ...result };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error(`[matchSync] Sync failed for ${riotAccountId}: ${errorMsg}`);

      await prisma.riotAccount.update({
        where: { id: riotAccountId },
        data: {
          syncStatus: "FAILED",
          lastSyncError: errorMsg,
        },
      });

      throw err;
    }
  }
);
