import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/prisma";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export type SubscriptionInfo = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

function toStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  const map: Partial<Record<Stripe.Subscription.Status, SubscriptionStatus>> = {
    active: "active",
    canceled: "canceled",
    past_due: "past_due",
    trialing: "trialing",
  };
  return map[stripeStatus] ?? "canceled";
}

function isActivePlan(stripeStatus: Stripe.Subscription.Status): boolean {
  return stripeStatus === "active" || stripeStatus === "trialing";
}

// Returns stripeCustomerId, creating the Stripe customer and Subscription row if needed.
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string | null
): Promise<string> {
  const existing = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });

  if (existing?.stripeCustomerId) return existing.stripeCustomerId;

  const customer = await getStripe().customers.create({
    email: email ?? undefined,
    metadata: { userId },
  });

  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, stripeCustomerId: customer.id, plan: "free", status: "active" },
    update: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// Called from webhook for subscription.updated / checkout.session.completed
export async function handleSubscriptionUpdate(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  // In Stripe v22+, billing period lives on the subscription item, not the subscription root
  const item = sub.items.data[0];
  const periodStart = item?.current_period_start ?? null;
  const periodEnd = item?.current_period_end ?? null;

  await prisma.subscription.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: sub.id,
      plan: isActivePlan(sub.status) ? "pro" : "free",
      status: toStatus(sub.status),
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });
}

// Called from webhook for subscription.deleted
export async function handleSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  await prisma.subscription.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      plan: "free",
      status: "canceled",
      stripeSubscriptionId: sub.id,
      cancelAtPeriodEnd: false,
    },
  });
}

export async function getCurrentSubscription(userId: string): Promise<SubscriptionInfo> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
  });
  return {
    plan: sub?.plan ?? "free",
    status: sub?.status ?? "active",
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
  };
}
