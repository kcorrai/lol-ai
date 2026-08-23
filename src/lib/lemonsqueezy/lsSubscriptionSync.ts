import { prisma } from "@/lib/db/prisma";
import type { LsSubscriptionAttributes, LsSubscriptionStatus } from "@/lib/lemonsqueezy/types";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

// Determines the internal plan based on LS variant ID and active status.
// Falls back to "pro" when variant_id is absent or doesn't match team variant.
function variantToPlan(variantId: number | undefined, isActive: boolean): SubscriptionPlan {
  if (!isActive) return "free";
  const teamVariantId = process.env.LEMONSQUEEZY_TEAM_VARIANT_ID;
  if (teamVariantId && variantId !== undefined && String(variantId) === teamVariantId)
    return "team";
  return "pro";
}

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

export function isActiveLsStatus(status: LsSubscriptionStatus): boolean {
  return status === "active" || status === "on_trial";
}

export async function upsertSubscription(
  userId: string,
  lsSubscriptionId: string,
  attrs: LsSubscriptionAttributes
): Promise<void> {
  const active = isActiveLsStatus(attrs.status);
  const plan: SubscriptionPlan = variantToPlan(attrs.variant_id, active);
  const status = lsStatusToSubscriptionStatus(attrs.status);
  const periodEnd = attrs.renews_at ?? attrs.ends_at;

  const fields = {
    lsCustomerId: String(attrs.customer_id),
    lsSubscriptionId,
    plan,
    status,
    currentPeriodEnd: periodEnd ? new Date(periodEnd) : null,
    cancelAtPeriodEnd: attrs.cancelled,
  };

  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, ...fields },
    update: fields,
  });
}
