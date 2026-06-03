import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import {
  verifyLsWebhookSignature,
  handleLsSubscriptionCreated,
  handleLsSubscriptionUpdated,
  handleLsSubscriptionCancelled,
} from "@/lib/lemonsqueezy/subscriptionService";
import type { LsWebhookPayload } from "@/lib/lemonsqueezy/types";

// LemonSqueezy sends raw JSON with X-Signature header — do NOT parse body before verification
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text();
  const signature = req.headers.get("x-signature");
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  if (!verifyLsWebhookSignature(body, signature, webhookSecret)) {
    logger.warn("[ls/webhook] Signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: LsWebhookPayload;
  try {
    payload = JSON.parse(body) as LsWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  logger.info("[ls/webhook] Received event", { event: eventName });

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
      default:
        // Acknowledge unknown events so LS doesn't retry
        break;
    }
  } catch (err) {
    logger.error("[ls/webhook] Handler failed", { event: eventName, err });
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
