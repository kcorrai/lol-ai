import { prisma } from "@/lib/db/prisma";
import { inngest } from "@/inngest/client";
import { logger } from "@/lib/utils/logger";
import { upsertSubscription } from "@/lib/lemonsqueezy/lsSubscriptionSync";
import type { LsWebhookPayload } from "@/lib/lemonsqueezy/types";

// Public API kept stable for existing importers.
export { createLsCheckoutUrl, createLsTeamCheckoutUrl } from "@/lib/lemonsqueezy/lsCheckout";
export {
  verifyLsWebhookSignature,
  buildEventKey,
  checkAndRecordEvent,
} from "@/lib/lemonsqueezy/lsWebhookVerify";

// ── Event handlers ───────────────────────────────────────────────────────────

export async function handleLsSubscriptionCreated(payload: LsWebhookPayload): Promise<void> {
  const userId = payload.meta.custom_data?.userId;
  if (!userId) {
    logger.warn("[lemonsqueezy] subscription_created without userId in custom_data");
    return;
  }
  await upsertSubscription(userId, payload.data.id, payload.data.attributes);
}

export async function handleLsSubscriptionUpdated(payload: LsWebhookPayload): Promise<void> {
  const subscriptionId = payload.data.id;
  const attrs = payload.data.attributes;

  const existing = await prisma.subscription.findFirst({
    where: { lsSubscriptionId: subscriptionId },
    select: { userId: true, plan: true },
  });

  if (!existing) {
    const userId = payload.meta.custom_data?.userId;
    if (!userId) {
      logger.warn("[lemonsqueezy] subscription_updated: no matching subscription", { subscriptionId });
      return;
    }
    await upsertSubscription(userId, subscriptionId, attrs);
    return;
  }

  await upsertSubscription(existing.userId, subscriptionId, attrs);

  // When a team plan subscription expires, notify the owner
  if (existing.plan === "team" && attrs.status === "expired") {
    await inngest.send({
      name: "team/subscription.expired",
      data: { userId: existing.userId },
    }).catch(() => { /* non-critical */ });
  }
}

export async function handleLsSubscriptionCancelled(payload: LsWebhookPayload): Promise<void> {
  const subscriptionId = payload.data.id;
  const attrs = payload.data.attributes;

  const existing = await prisma.subscription.findFirst({
    where: { lsSubscriptionId: subscriptionId },
    select: { userId: true, plan: true },
  });

  // Mark as pending cancellation — stays active until period end
  await prisma.subscription.updateMany({
    where: { lsSubscriptionId: subscriptionId },
    data: { cancelAtPeriodEnd: true, status: "active" },
  });

  // Notify team plan owners so they can warn their members
  if (existing?.plan === "team") {
    await inngest.send({
      name: "team/subscription.cancelled",
      data: {
        userId: existing.userId,
        periodEndDate: attrs.renews_at ?? attrs.ends_at ?? undefined,
      },
    }).catch(() => { /* non-critical */ });
  }
}

export async function handleLsPaymentFailed(payload: LsWebhookPayload): Promise<void> {
  const subscriptionId = payload.data.id;

  await prisma.subscription.updateMany({
    where: { lsSubscriptionId: subscriptionId },
    data: { status: "past_due" },
  });

  logger.warn("[lemonsqueezy] payment failed — subscription set to past_due", { subscriptionId });
}
