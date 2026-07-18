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

// Returns true if this event was already processed (duplicate delivery).
// Creates a log entry atomically when first seen.
export async function checkAndRecordEvent(eventKey: string): Promise<boolean> {
  try {
    await prisma.webhookEvent.create({ data: { eventKey } });
    return false; // not a duplicate — proceed
  } catch {
    // Unique constraint violation → duplicate
    return true;
  }
}
