import { logger } from "@/lib/utils/logger";
import {
  handleLsSubscriptionCreated,
  handleLsSubscriptionUpdated,
  handleLsSubscriptionCancelled,
  handleLsPaymentFailed,
} from "@/lib/lemonsqueezy/subscriptionService";
import type { LsWebhookPayload } from "@/lib/lemonsqueezy/types";

// Routes a verified LemonSqueezy webhook event to its handler. Unknown events are
// acknowledged (no-op) so LemonSqueezy stops retrying them.
export async function dispatchLsWebhookEvent(
  eventName: string,
  payload: LsWebhookPayload
): Promise<void> {
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
}
