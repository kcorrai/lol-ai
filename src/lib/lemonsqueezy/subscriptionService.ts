import { createHmac, timingSafeEqual } from "crypto";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { prisma } from "@/lib/db/prisma";
import { getLsClient, getLsStoreId, getLsProVariantId, getLsProYearlyVariantId } from "@/lib/lemonsqueezy/client";
import { logger } from "@/lib/utils/logger";
import type {
  LsSubscriptionAttributes,
  LsSubscriptionStatus,
  LsWebhookPayload,
} from "@/lib/lemonsqueezy/types";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

// ── Checkout ────────────────────────────────────────────────────────────────

export async function createLsCheckoutUrl(
  userId: string,
  userEmail: string | null,
  period: "monthly" | "annual" = "monthly"
): Promise<string> {
  getLsClient();

  const storeId = getLsStoreId();
  const variantId =
    period === "annual"
      ? getLsProYearlyVariantId()
      : getLsProVariantId();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

  const { data, error } = await createCheckout(storeId, variantId, {
    checkoutOptions: { embed: false, media: false, logo: true },
    checkoutData: {
      email: userEmail ?? undefined,
      custom: { userId },
    },
    productOptions: {
      redirectUrl: `${appUrl}/dashboard?upgraded=true`,
      receiptButtonText: "Go to Dashboard",
      receiptThankYouNote: "Welcome to Pro! Your account has been upgraded.",
    },
  });

  if (error || !data?.data?.attributes?.url) {
    logger.error("[lemonsqueezy] createCheckout failed", { error });
    throw new Error("Failed to create LemonSqueezy checkout session");
  }

  return data.data.attributes.url;
}

// ── Webhook signature ────────────────────────────────────────────────────────

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

// ── Idempotency ──────────────────────────────────────────────────────────────

// Builds a stable deduplication key from the LS subscription payload.
// Format: "{event_name}:{subscription_id}:{status}:{renews_at}"
// Same event retried by LS produces the identical key → safely skipped.
function buildEventKey(eventName: string, subscriptionId: string, attrs: LsSubscriptionAttributes): string {
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

// ── Status mapping ───────────────────────────────────────────────────────────

function lsStatusToSubscriptionStatus(status: LsSubscriptionStatus): SubscriptionStatus {
  const map: Record<LsSubscriptionStatus, SubscriptionStatus> = {
    active: "active",
    on_trial: "trialing",
    paused: "canceled",
    past_due: "past_due",
    unpaid: "past_due",
    cancelled: "canceled",
    expired: "canceled",
  };
  return map[status] ?? "canceled";
}

function isActiveLsStatus(status: LsSubscriptionStatus): boolean {
  return status === "active" || status === "on_trial";
}

// ── Event handlers ───────────────────────────────────────────────────────────

export async function handleLsSubscriptionCreated(
  payload: LsWebhookPayload
): Promise<void> {
  const userId = payload.meta.custom_data?.userId;
  if (!userId) {
    logger.warn("[lemonsqueezy] subscription_created without userId in custom_data");
    return;
  }
  await upsertSubscription(userId, payload.data.id, payload.data.attributes);
}

export async function handleLsSubscriptionUpdated(
  payload: LsWebhookPayload
): Promise<void> {
  const subscriptionId = payload.data.id;
  const attrs = payload.data.attributes;

  const existing = await prisma.subscription.findFirst({
    where: { lsSubscriptionId: subscriptionId },
    select: { userId: true },
  });

  if (!existing) {
    const userId = payload.meta.custom_data?.userId;
    if (!userId) {
      logger.warn("[lemonsqueezy] subscription_updated: no matching subscription", {
        subscriptionId,
      });
      return;
    }
    await upsertSubscription(userId, subscriptionId, attrs);
    return;
  }

  await upsertSubscription(existing.userId, subscriptionId, attrs);
}

export async function handleLsSubscriptionCancelled(
  payload: LsWebhookPayload
): Promise<void> {
  const subscriptionId = payload.data.id;

  // Mark as pending cancellation — stays active until period end
  await prisma.subscription.updateMany({
    where: { lsSubscriptionId: subscriptionId },
    data: { cancelAtPeriodEnd: true, status: "active" },
  });
}

// ── Shared upsert ────────────────────────────────────────────────────────────

async function upsertSubscription(
  userId: string,
  lsSubscriptionId: string,
  attrs: LsSubscriptionAttributes
): Promise<void> {
  const plan: SubscriptionPlan = isActiveLsStatus(attrs.status) ? "pro" : "free";
  const status = lsStatusToSubscriptionStatus(attrs.status);
  const periodEnd = attrs.renews_at ?? attrs.ends_at;

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      lsCustomerId: String(attrs.customer_id),
      lsSubscriptionId,
      plan,
      status,
      currentPeriodEnd: periodEnd ? new Date(periodEnd) : null,
      cancelAtPeriodEnd: attrs.cancelled,
    },
    update: {
      lsCustomerId: String(attrs.customer_id),
      lsSubscriptionId,
      plan,
      status,
      currentPeriodEnd: periodEnd ? new Date(periodEnd) : null,
      cancelAtPeriodEnd: attrs.cancelled,
    },
  });
}

// Re-export for webhook route
export { buildEventKey };
