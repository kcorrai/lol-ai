import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import {
  verifyLsWebhookSignature,
  claimWebhookEvent,
  markWebhookEventProcessed,
  buildEventKey,
} from "@/lib/lemonsqueezy/subscriptionService";
import { dispatchLsWebhookEvent } from "@/lib/lemonsqueezy/lsWebhookDispatch";
import type { LsWebhookPayload } from "@/lib/lemonsqueezy/types";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text();
  const signature = req.headers.get("x-signature");
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  // Hard reject when signature infrastructure is missing
  if (!webhookSecret) {
    logger.error("[ls/webhook] LEMONSQUEEZY_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }
  if (!signature) {
    return NextResponse.json({ error: "Missing X-Signature header" }, { status: 400 });
  }
  if (!verifyLsWebhookSignature(body, signature, webhookSecret)) {
    logger.warn("[ls/webhook] Signature verification failed — rejecting");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: LsWebhookPayload;
  try {
    payload = JSON.parse(body) as LsWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  if (!eventName) {
    return NextResponse.json({ error: "Missing event_name" }, { status: 400 });
  }

  // Claim the event. The unique constraint on eventKey means a concurrent
  // duplicate delivery loses the race and is skipped here.
  const eventKey = buildEventKey(eventName, payload.data.id, payload.data.attributes);
  if (!(await claimWebhookEvent(eventKey))) {
    logger.info("[ls/webhook] Duplicate event — already processed", { eventKey });
    return NextResponse.json({ received: true, duplicate: true });
  }

  logger.info("[ls/webhook] Processing event", { event: eventName, key: eventKey });

  try {
    await dispatchLsWebhookEvent(eventName, payload);
  } catch (err) {
    logger.error("[ls/webhook] Handler failed", { event: eventName, err });
    // 500 so LemonSqueezy retries. The claim is left unstamped, so the retry
    // reclaims it and runs the handler again rather than being swallowed as a
    // duplicate — previously a transient failure here silently dropped a paid
    // subscription forever (TASK-270).
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  // Only now does a later delivery of this event count as a duplicate.
  await markWebhookEventProcessed(eventKey);

  return NextResponse.json({ received: true });
}
