import { inngest } from "@/inngest/client";
import { runBookingSweeps } from "@/domains/marketplace";
import { logger } from "@/lib/utils/logger";

/**
 * The marketplace's promises, kept on a schedule.
 *
 * Every five minutes, because the three things this does are all deadlines
 * somebody is waiting on: a request that expires, a delivery that settles, a
 * review that appears. An hourly sweep would mean a coach's money sitting
 * unreleased for up to an hour after it was due, and a student staring at a
 * request that "expired" fifty minutes ago and still looks live.
 *
 * Inngest rather than a Vercel cron: Vercel caps a project at 100 cron jobs and
 * at one-a-day on Hobby, and this is one of several schedules this section
 * needs. Inngest is already a dependency and already runs the esports warmer on
 * the same pattern.
 */
export const marketplaceSweeps = inngest.createFunction(
  { id: "marketplace-sweeps", triggers: [{ cron: "*/5 * * * *" }], retries: 1 },
  async () => {
    const report = await runBookingSweeps();

    if (report.failed > 0) {
      // Warned rather than thrown: the sweeps that did work should not be
      // re-run by a retry just because one of them did not.
      logger.warn("[marketplaceSweeps] a sweep failed", report);
    }

    return report;
  }
);
