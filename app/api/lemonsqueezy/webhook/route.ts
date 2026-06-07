import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import {
  verifyLsWebhookSignature,
  checkAndRecordEvent,
  buildEventKey,
  handleLsSubscriptionCreated,
  handleLsSubscriptionUpdated,
  handleLsSubscriptionCancelled,
  handleLsPaymentFailed,
} from "@/lib/lemonsqueezy/subscriptionService";
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
  const isDuplicate = await checkAndRecordEvent(eventKey);
  if (isDuplicate) {
    logger.info("[ls/webhook] Duplicate event — already processed", { eventKey });
    return NextResponse.json({ received: true, duplicate: true });
  }

  logger.info("[ls/webhook] Processing event", { event: eventName, key: eventKey });

  try {
    switch (eventName) {
      case "subscription_created":
        await handleLsSubscriptionCreated(payload);
        break;
      case "subscription_updated":
      case "subscription_resumed":
        await handleLsSubscriptionUpdated(payload);
        break;
      case "subscription_cancelled":
        await handleLsSubscriptionCancelled(payload);
        break;
      case "subscription_expired":
      case "subscription_paused":
        await handleLsSubscriptionUpdated(payload);
        break;
      case "subscription_payment_failed":
        await handleLsPaymentFailed(payload);
        break;
      default:
        logger.info("[ls/webhook] Unhandled event type (acknowledged)", { event: eventName });
        break;
    }
  } catch (err) {
    logger.error("[ls/webhook] Handler failed", { event: eventName, err });
    // Return 500 so LS retries — idempotency key is already written, so
    // next delivery will be a duplicate and return 200 without re-processing.
    // This is intentional: we'd rather lose an event than double-process.
    // For truly critical failures, alert via Sentry (captured by withAuth wrapper).
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
