import { prisma } from "@/lib/db/prisma";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export type SubscriptionInfo = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  isReferralTrial: boolean;
  referralTrialEndsAt: Date | null;
};

export async function getCurrentSubscription(userId: string): Promise<SubscriptionInfo> {
  const [sub, user] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { proTrialEndsAt: true },
    }),
  ]);

  const isReferralTrial = user?.proTrialEndsAt != null && user.proTrialEndsAt > new Date();
  const basePlan = sub?.plan ?? "free";

  return {
    plan: isReferralTrial && basePlan === "free" ? "pro" : basePlan,
    status: sub?.status ?? "active",
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    isReferralTrial,
    referralTrialEndsAt: user?.proTrialEndsAt ?? null,
  };
}
