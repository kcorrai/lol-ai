import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import {
  verifyLsWebhookSignature,
  checkAndRecordEvent,
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

  // Idempotency check — skip duplicate deliveries (LS retries on 5xx)
  const eventKey = buildEventKey(eventName, payload.data.id, payload.data.attributes);
  if (await checkAndRecordEvent(eventKey)) {
    logger.info("[ls/webhook] Duplicate event — already processed", { eventKey });
    return NextResponse.json({ received: true, duplicate: true });
  }

  logger.info("[ls/webhook] Processing event", { event: eventName, key: eventKey });

  try {
    await dispatchLsWebhookEvent(eventName, payload);
  } catch (err) {
    logger.error("[ls/webhook] Handler failed", { event: eventName, err });
    // Return 500 so LS retries — the idempotency key is already written, so the
    // next delivery is a duplicate and returns 200 without re-processing. This is
    // intentional: we'd rather lose an event than double-process.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
