import { inngest } from "@/inngest/client";
import { getOrCreateCurrentPatch } from "@/domains/analysis/services/patchService";
import { logger } from "@/lib/utils/logger";

// Runs daily at 08:00 UTC to detect new League of Legends patch versions.
export const patchVersionPoller = inngest.createFunction(
  { id: "patch-version-poller", triggers: [{ cron: "0 8 * * *" }], retries: 2 },
  async () => {
    logger.info("[patchPoller] Checking for new patch version…");
    const result = await getOrCreateCurrentPatch();
    if (result.isNew) {
      logger.info(`[patchPoller] New patch detected: ${result.version}`);
    } else {
      logger.info(`[patchPoller] Already on latest: ${result.version}`);
    }
    return { version: result.version, isNew: result.isNew };
  }
);
