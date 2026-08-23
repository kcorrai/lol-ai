import * as Sentry from "@sentry/nextjs";
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
  inProcess: () => Promise<unknown>
): Promise<void> {
  try {
    await inngest.send(event);
  } catch (err) {
    logger.warn(
      `[dispatch] Inngest send failed, running in-process: ${err instanceof Error ? err.message : String(err)}`
    );
    // Fire-and-forget — the caller has already responded 202/accepted; status is tracked in the DB.
    void inProcess().catch((e) =>
      logger.error(
        "[dispatch] In-process fallback failed",
        e instanceof Error ? e : new Error(String(e))
      )
    );
  }
}

/**
 * Send events that have no in-process fallback, and make a failure impossible to miss.
 *
 * There is a difference between a send that fails with somewhere to fall back to and one
 * without, and it is not a difference of degree. The first is a slow path; the second is
 * work that is simply gone — nothing retries it, nothing records that it was owed, and the
 * request that dispatched it has already answered.
 *
 * So this reports rather than swallows. It was a `logger.warn` on the sync's own batch until
 * LA-66, where the whole reason a feature had never worked locally turned out to be sitting
 * in that one line, unread for weeks. In production the same line would let an Inngest outage
 * drop every background job the sync owes without anything noticing.
 *
 * It still does not throw. The caller has already done the work these events are about, and
 * failing their request because a follow-up job could not be queued would turn a degraded
 * background path into a broken foreground one.
 */
export async function dispatchOrReport(events: InngestEvent, context: string): Promise<boolean> {
  try {
    await inngest.send(events);
    return true;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    const names = eventNames(events);
    logger.error(
      `[dispatch] ${context}: ${names.length} background job(s) were not queued and are lost: ${names.join(", ")}`,
      error
    );
    Sentry.captureException(error, {
      tags: { dispatch: context },
      extra: { events: names },
    });
    return false;
  }
}

/** The event names in a send, for a log line that says what was actually lost. */
function eventNames(events: InngestEvent): string[] {
  const list = Array.isArray(events) ? events : [events];
  return list.map((e) =>
    typeof e === "object" && e !== null && "name" in e ? String(e.name) : "unknown"
  );
}
