import { inngest } from "@/inngest/client";
import { checkMasteryDecay } from "@/domains/academy";
import { logger } from "@/lib/utils/logger";

// Runs nightly at 06:00 UTC (LA-24 / ADR-027). A lesson mastered three weeks ago is measured
// again against the same target, in the same role, and drops to `review` if the player is no
// longer holding it. Measured rather than timed: somebody who has kept the habit for a year is
// never sent back, and somebody who has not played that role since is left alone.
export const academyDecayChecker = inngest.createFunction(
  { id: "academy-decay-checker", triggers: [{ cron: "0 6 * * *" }], retries: 2 },
  async () => {
    const result = await checkMasteryDecay();

    logger.info(
      `[academyDecay] checked ${result.checked}, holding ${result.holding}, decayed ${result.decayed.length}, unmeasured ${result.unmeasured}`
    );

    return { ...result, decayed: result.decayed.length };
  }
);
