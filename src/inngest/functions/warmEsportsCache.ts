import { inngest } from "@/inngest/client";
import { warmEsports } from "@/domains/esports/services/warmService";
import { logger } from "@/lib/utils/logger";

/**
 * How many feed requests one run may spend.
 *
 * Sized to clear the whole warm list once (the pro sample alone is ~150), with
 * room for the schedule paging to grow a little before the cap starts cutting
 * tasks. If it ever does start cutting, the run says which tasks it dropped
 * rather than failing silently.
 */
const REQUEST_BUDGET = 200;

/**
 * Keeps the esports caches warm so a reader never pays for a rebuild.
 *
 * Every 45 minutes, against a one-hour TTL. The gap is deliberate: warming on
 * the same period as the TTL would race it, and the visitor arriving in the
 * minute after expiry is exactly the one this exists to protect. Esports traffic
 * is spiky and time-locked — everyone arrives in the ten minutes after a series
 * ends — so the cost of being cold is concentrated on the worst possible moment.
 *
 * It writes only to the cache. Nothing here touches Postgres, which keeps the
 * section stateless in the read path (ADR-016).
 */
export const warmEsportsCache = inngest.createFunction(
  { id: "warm-esports-cache", triggers: [{ cron: "*/45 * * * *" }], retries: 1 },
  async () => {
    const report = await warmEsports({ budget: REQUEST_BUDGET });

    if (report.failed.length > 0) {
      // Warned rather than thrown: a partial warm is still worth having, and a
      // retry would spend the budget again on the tasks that already succeeded.
      logger.warn("[warmEsportsCache] some resources did not refresh", {
        failed: report.failed,
      });
    }

    return report;
  }
);
