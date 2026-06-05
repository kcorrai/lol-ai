import { prisma } from "@/lib/db/prisma";
import { Errors } from "@/lib/api/errors";
import type { SubscriptionPlan } from "@prisma/client";

// Plan limits — single source of truth for all feature gating.
// -1 = unlimited; false = feature disabled for this plan.
export const PLAN_LIMITS = {
  free: {
    maxRiotAccounts: 1,
    reportsPerMonth: 3,
    reportsPerDay: 1,
    matchHistoryDepth: 10,
    championPoolLimit: 3,
    fullCoachingReport: false,
    matchupAnalysisPerDay: 5,
    otpAnalysisPerDay: 3,
    draftAnalysisPerDay: 3,
  },
  pro: {
    maxRiotAccounts: 3,
    reportsPerMonth: -1,
    reportsPerDay: -1,
    matchHistoryDepth: 100,
    championPoolLimit: -1,
    fullCoachingReport: true,
    matchupAnalysisPerDay: -1,
    otpAnalysisPerDay: -1,
    draftAnalysisPerDay: -1,
  },
  elite: {
    maxRiotAccounts: 5,
    reportsPerMonth: -1,
    reportsPerDay: -1,
    matchHistoryDepth: 200,
    championPoolLimit: -1,
    fullCoachingReport: true,
    matchupAnalysisPerDay: -1,
    otpAnalysisPerDay: -1,
    draftAnalysisPerDay: -1,
  },
} satisfies Record<SubscriptionPlan, PlanLimits>;

export type PlanLimits = {
  maxRiotAccounts: number;
  reportsPerMonth: number;
  reportsPerDay: number;
  matchHistoryDepth: number;
  championPoolLimit: number;
  fullCoachingReport: boolean;
  matchupAnalysisPerDay: number;
  otpAnalysisPerDay: number;
  draftAnalysisPerDay: number;
};

// Returns effective plan limits. Falls back to free when subscription is
// missing, canceled, expired, or otherwise inactive.
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

// ── Ownership ────────────────────────────────────────────────────────────────

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

// ── Account limits ───────────────────────────────────────────────────────────

export async function assertCanAddRiotAccount(userId: string): Promise<void> {
  const limits = await getPlanLimits(userId);
  const currentCount = await prisma.riotAccount.count({ where: { userId } });
  if (currentCount >= limits.maxRiotAccounts) throw Errors.accountLimitReached();
}

// ── Plan helpers ─────────────────────────────────────────────────────────────

export async function checkIsPro(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  });
  const isActive =
    subscription?.status === "active" || subscription?.status === "trialing";
  return isActive && (subscription?.plan === "pro" || subscription?.plan === "elite");
}

// ── Report limits ────────────────────────────────────────────────────────────

export async function assertCanGenerateReport(userId: string): Promise<void> {
  const limits = await getPlanLimits(userId);

  // Monthly cap
  if (limits.reportsPerMonth !== -1) {
    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - 30);

    const monthCount = await prisma.coachingReport.count({
      where: {
        riotAccount: { userId },
        createdAt: { gte: monthStart },
        status: { in: ["complete", "pending"] },
      },
    });

    if (monthCount >= limits.reportsPerMonth) throw Errors.reportLimitReached();
  }

  // Daily cap — prevents exhausting the monthly quota in one session
  if (limits.reportsPerDay !== -1) {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayCount = await prisma.coachingReport.count({
      where: {
        riotAccount: { userId },
        createdAt: { gte: todayStart },
        status: { in: ["complete", "pending"] },
      },
    });

    if (todayCount >= limits.reportsPerDay) throw Errors.dailyReportLimitReached();
  }
}
