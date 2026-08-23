import { inngest } from "@/inngest/client";
import { computeAndSaveSnapshot } from "@/domains/analysis/services/performanceSnapshotService";
import { detectAndPersistHabits } from "@/domains/analysis/services/habitDetectionService";
import { logger } from "@/lib/utils/logger";

export const performanceSnapshotWorker = inngest.createFunction(
  {
    id: "performance-snapshot-worker",
    triggers: [{ event: "snapshot/compute" }],
    concurrency: { limit: 1, key: "event.data.riotAccountId" },
    retries: 1,
  },
  async ({ event }) => {
    const { riotAccountId } = event.data as { riotAccountId: string };

    await computeAndSaveSnapshot(riotAccountId);

    // Run habit detection immediately after snapshot so habits stay up to date
    await detectAndPersistHabits(riotAccountId).catch((err) =>
      logger.warn(
        `[snapshotWorker] Habit detection failed: ${err instanceof Error ? err.message : String(err)}`
      )
    );

    return { riotAccountId };
  }
);
