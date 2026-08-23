import { prisma } from "@/lib/db/prisma";
import { toJsonInput, fromJsonValue } from "@/types/json";
import { getPlayerPerformanceProfile } from "./matchAnalysisService";
import {
  PLAN_DAYS,
  buildCandidates,
  getCurrentValue,
  toProgress,
  buildPlanWithProgress,
  computeWeeklyScore,
} from "./improvementPlanCompute";
import type { ImprovementTarget, PlanWithProgress } from "@/domains/analysis/types/analysis.types";

export { computeWeeklyScore } from "./improvementPlanCompute";

export async function getActivePlan(riotAccountId: string): Promise<PlanWithProgress | null> {
  const plan = await prisma.improvementPlan.findFirst({
    where: { riotAccountId },
    orderBy: { createdAt: "desc" },
  });

  if (!plan) return null;

  const profile = await getPlayerPerformanceProfile(riotAccountId, 20);
  return buildPlanWithProgress(plan, profile);
}

export interface PlanHistoryEntry {
  id: string;
  createdAt: string;
  expiresAt: string;
  status: string;
  completedCount: number;
  totalTargets: number;
  weeklyScore: number;
}

export async function getPlanHistory(riotAccountId: string): Promise<PlanHistoryEntry[]> {
  const plans = await prisma.improvementPlan.findMany({
    where: { riotAccountId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const profile = await getPlayerPerformanceProfile(riotAccountId, 30);

  return plans.map((plan) => {
    const targets = fromJsonValue<ImprovementTarget[]>(plan.targets) ?? [];
    const progresses = targets.map((t) => toProgress(t, getCurrentValue(t.metric, profile)));
    const score = computeWeeklyScore(progresses);
    return {
      id: plan.id,
      createdAt: plan.createdAt.toISOString(),
      expiresAt: plan.expiresAt.toISOString(),
      status: plan.status,
      completedCount: progresses.filter((p) => p.achieved).length,
      totalTargets: targets.length,
      weeklyScore: score,
    };
  });
}

export async function generatePlan(riotAccountId: string): Promise<PlanWithProgress> {
  const profile = await getPlayerPerformanceProfile(riotAccountId, 20);
  const targets = buildCandidates(profile);

  // Expire all existing active plans before creating the new one
  await prisma.improvementPlan.updateMany({
    where: { riotAccountId, status: "active" },
    data: { status: "expired" },
  });

  const expiresAt = new Date(Date.now() + PLAN_DAYS * 24 * 60 * 60 * 1000);
  const plan = await prisma.improvementPlan.create({
    data: {
      riotAccountId,
      expiresAt,
      targets: toJsonInput(targets),
    },
  });

  return buildPlanWithProgress(plan, profile);
}
