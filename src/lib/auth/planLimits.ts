import { prisma } from "@/lib/db/prisma";
import type { SubscriptionPlan } from "@prisma/client";

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
  // Team plan: same individual limits as elite; team features gated separately
  team: {
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

// Returns effective plan limits. Falls back to free when subscription is
// missing, canceled, expired, or otherwise inactive.
export async function getPlanLimits(userId: string): Promise<PlanLimits> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  });

  const isActive = subscription?.status === "active" || subscription?.status === "trialing";

  const plan: SubscriptionPlan = isActive && subscription ? subscription.plan : "free";

  return PLAN_LIMITS[plan];
}
