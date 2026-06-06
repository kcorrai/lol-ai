import { prisma } from "@/lib/db/prisma";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export type SubscriptionInfo = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

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
