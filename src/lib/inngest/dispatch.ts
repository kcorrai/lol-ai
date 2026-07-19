import { inngest } from "@/inngest/client";
import { logger } from "@/lib/utils/logger";

type InngestEvent = Parameters<typeof inngest.send>[0];

// Dispatch a background job via Inngest, but fall back to running it in-process if the send fails.
//
// Inngest is the durable path in production (retries, concurrency, idempotency). Locally, however,
// the Inngest dev server usually isn't running, so `inngest.send` throws ECONNREFUSED and the job
// (match sync, report generation, …) never executes — the action just fails. Rather than depend on
// a separate CLI for basic flows to work, we run the same work in-process when dispatch fails. This
// also gives graceful degradation if Inngest has an outage in production (TASK-223).
export async function dispatchOrRunInProcess(
  event: InngestEvent,
  inProcess: () => Promise<unknown>,
): Promise<void> {
  try {
    await inngest.send(event);
  } catch (err) {
    logger.warn(
      `[dispatch] Inngest send failed, running in-process: ${err instanceof Error ? err.message : String(err)}`,
    );
    // Fire-and-forget — the caller has already responded 202/accepted; status is tracked in the DB.
    void inProcess().catch((e) =>
      logger.error("[dispatch] In-process fallback failed", e instanceof Error ? e : new Error(String(e))),
    );
  }
}
