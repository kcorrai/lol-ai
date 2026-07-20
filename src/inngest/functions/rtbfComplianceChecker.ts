import { inngest } from "@/inngest/client";
import { sweepForgottenAccounts } from "@/domains/riot/services/rtbfService";
import { logger } from "@/lib/utils/logger";

// Riot asks that player accounts be refreshed "at least once every 30 days" so
// right-to-be-forgotten renames are noticed and the associations dropped. Runs
// daily rather than monthly so the work is spread thin and a missed day never
// pushes an account past the 30-day window (TASK-287).
export const rtbfComplianceChecker = inngest.createFunction(
  { id: "rtbf-compliance-checker", triggers: [{ cron: "0 3 * * *" }], retries: 2 },
  async () => {
    const result = await sweepForgottenAccounts();

    // `remaining` is logged on every run: a capped batch that stays silent would
    // read as full coverage while a backlog quietly persists.
    logger.info("[rtbf] Sweep complete", result);

    return result;
  }
);
