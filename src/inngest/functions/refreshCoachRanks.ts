import { inngest } from "@/inngest/client";
import { refreshStaleBadges } from "@/domains/marketplace";
import { logger } from "@/lib/utils/logger";

/** How many badges one run may refresh. */
const BATCH = 200;

/**
 * Keeps every coach's rank badge current.
 *
 * The badge's whole claim is "we read this ourselves, on this date" — so a date
 * that stops moving turns the one thing no competitor offers into the same
 * stale self-report everybody else has. Badges go stale after 36 hours and this
 * runs every 6, which leaves several chances to catch one before a reader ever
 * sees it marked out of date.
 *
 * It reads only from `ranked_history`, which the rank-snapshot sweep already
 * fills, so this costs no Riot calls of its own.
 */
export const refreshCoachRanks = inngest.createFunction(
  { id: "refresh-coach-ranks", triggers: [{ cron: "0 */6 * * *" }], retries: 1 },
  async () => {
    const report = await refreshStaleBadges(BATCH);

    if (report.checked === BATCH) {
      // Not an error — the next run picks the rest up, and they are already
      // showing as stale meanwhile. Worth saying out loud so a permanently
      // saturated batch is visible rather than silently truncating for ever.
      logger.warn("[refreshCoachRanks] hit the batch ceiling", { batch: BATCH });
    }

    return report;
  }
);
