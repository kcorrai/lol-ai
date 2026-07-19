import { inngest } from "@/inngest/client";
import { runSyncWithStatus } from "@/domains/riot/services/matchSyncService";

export interface MatchSyncPayload {
  riotAccountId: string;
  userId: string;
}

// Durable Inngest worker around runSyncWithStatus (shared with the sync route's in-process
// fallback). Concurrency key ensures only one sync runs per account at a time.
export const matchSyncWorker = inngest.createFunction(
  {
    id: "match-sync-worker",
    triggers: [{ event: "riot/sync.requested" }],
    concurrency: { limit: 1, key: "event.data.riotAccountId" },
    retries: 2,
  },
  async ({ event }) => {
    const { riotAccountId, userId } = event.data as MatchSyncPayload;
    const result = await runSyncWithStatus(riotAccountId, userId);
    return { status: "completed", ...result };
  }
);
