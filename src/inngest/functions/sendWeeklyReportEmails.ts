import { inngest } from "@/inngest/client";
import { sendWeeklyReports } from "@/domains/coaching/services/weeklyReportService";
import { logger } from "@/lib/utils/logger";

// Fires every Monday at 09:00 UTC.
// The service layer handles idempotency (one email per user per ISO week)
// so safe retries won't double-send.
export const sendWeeklyReportEmails = inngest.createFunction(
  {
    id: "send-weekly-report-emails",
    triggers: [{ cron: "0 9 * * 1" }],
    retries: 2,
  },
  async () => {
    logger.info("[weekly-report] cron triggered");
    const result = await sendWeeklyReports();
    logger.info("[weekly-report] cron done", result);
    return result;
  }
);
