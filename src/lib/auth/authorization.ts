import { prisma } from "@/lib/db/prisma";
import { Errors } from "@/lib/api/errors";
import type { SubscriptionPlan } from "@prisma/client";

// Plan limits — source of truth for feature gating
// Matches PRD.md revenue model section
export const PLAN_LIMITS = {
  free: {
    maxRiotAccounts: 1,
    reportsPerWeek: 1,
    matchHistoryDepth: 10,
  },
  pro: {
    maxRiotAccounts: 3,
    reportsPerWeek: -1, // unlimited
    matchHistoryDepth: 100,
  },
  elite: {
    maxRiotAccounts: 5,
    reportsPerWeek: -1,
    matchHistoryDepth: 200,
  },
} satisfies Record<SubscriptionPlan, PlanLimits>;

export type PlanLimits = {
  maxRiotAccounts: number;
  reportsPerWeek: number;
  matchHistoryDepth: number;
};

// Returns the effective plan limits for a user.
// Falls back to free-tier limits if no subscription exists.
export async function getPlanLimits(userId: string): Promise<PlanLimits> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  });

  const isActive =
    subscription?.status === "active" || subscription?.status === "trialing";

  const plan: SubscriptionPlan =
    isActive && subscription ? subscription.plan : "free";

  return PLAN_LIMITS[plan];
}

// Throws 403 if the riotAccountId doesn't belong to the given userId.
// Call this before any operation on a RiotAccount.
export async function assertOwnsRiotAccount(
  userId: string,
  riotAccountId: string
): Promise<void> {
  const account = await prisma.riotAccount.findFirst({
    where: { id: riotAccountId, userId },
    select: { id: true },
  });

  if (!account) throw Errors.riotAccountNotOwned();
}

// Throws 403 if user has reached the max riot accounts for their plan.
export async function assertCanAddRiotAccount(userId: string): Promise<void> {
  const limits = await getPlanLimits(userId);
  const currentCount = await prisma.riotAccount.count({ where: { userId } });

  if (currentCount >= limits.maxRiotAccounts) {
    throw Errors.accountLimitReached();
  }
}

// Throws 403 if user has reached their weekly AI report limit.
export async function assertCanGenerateReport(userId: string): Promise<void> {
  const limits = await getPlanLimits(userId);
  if (limits.reportsPerWeek === -1) return; // unlimited

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const recentReportCount = await prisma.coachingReport.count({
    where: {
      riotAccount: { userId },
      createdAt: { gte: weekStart },
      status: { in: ["complete", "processing", "pending"] },
    },
  });

  if (recentReportCount >= limits.reportsPerWeek) {
    throw Errors.reportLimitReached();
  }
}
