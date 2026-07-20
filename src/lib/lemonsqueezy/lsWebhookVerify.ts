import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db/prisma";
import type { LsSubscriptionAttributes } from "@/lib/lemonsqueezy/types";

export function verifyLsWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const hash = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

// Builds a stable deduplication key from the LS subscription payload.
// Format: "{event_name}:{subscription_id}:{status}:{renews_at}"
// Same event retried by LS produces the identical key → safely skipped.
export function buildEventKey(
  eventName: string,
  subscriptionId: string,
  attrs: LsSubscriptionAttributes
): string {
  return `${eventName}:${subscriptionId}:${attrs.status}:${attrs.renews_at ?? attrs.ends_at ?? ""}`;
}

// Claims an event for processing. Returns true when the caller should proceed.
//
// The unique constraint on eventKey is the lock: a concurrent duplicate delivery
// loses the insert race and is told to skip. A row whose processedAt is still
// null belongs to an attempt that failed or crashed before finishing, so a
// retry is allowed to pick it up again — that is what stops a transient handler
// error from silently discarding a paid subscription (TASK-270). Re-running a
// handler is safe; every one of them upserts.
export async function claimWebhookEvent(eventKey: string): Promise<boolean> {
  try {
    await prisma.webhookEvent.create({ data: { eventKey, processedAt: null } });
    return true;
  } catch {
    // Unique constraint violation — someone already claimed this key.
    const existing = await prisma.webhookEvent.findUnique({
      where: { eventKey },
      select: { processedAt: true },
    });
    return existing?.processedAt === null;
  }
}

// Stamps a claimed event as finished. Only after this does a later delivery of
// the same event count as a duplicate.
export async function markWebhookEventProcessed(eventKey: string): Promise<void> {
  await prisma.webhookEvent.update({
    where: { eventKey },
    data: { processedAt: new Date() },
  });
}
