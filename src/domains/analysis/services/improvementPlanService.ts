import { prisma } from "@/lib/db/prisma";
import { toJsonInput, fromJsonValue } from "@/types/json";
import { getPlayerPerformanceProfile } from "./matchAnalysisService";
import type {
  ImprovementTarget,
  PlanMetric,
  PlanProgress,
  PlanWithProgress,
  PlayerPerformanceProfile,
} from "@/domains/analysis/types/analysis.types";

const PLAN_DAYS = 14;

// ── Target selection ─────────────────────────────────────────────────────────

type Candidate = ImprovementTarget & { deficiency: number };

function buildCandidates(profile: PlayerPerformanceProfile): Candidate[] {
  const { avgMetrics, winRate, recentMatches } = profile;
  const avgVision =
    recentMatches.length > 0
      ? recentMatches.reduce((s, m) => s + m.visionScore, 0) / recentMatches.length
      : 0;

  const out: Candidate[] = [];

  // Win rate — everyone benefits
  if (winRate < 58) {
    out.push({
      metric: "winRate",
      label: "Win Rate",
      baseline: parseFloat(winRate.toFixed(1)),
      goal: parseFloat(Math.min(winRate + 8, 65).toFixed(1)),
      unit: "%",
      direction: "increase",
      deficiency: Math.max(0, (55 - winRate) / 55),
    });
  }

  // Deaths
  if (avgMetrics.avgDeathsPerGame > 3.5) {
    out.push({
      metric: "deaths",
      label: "Deaths / Game",
      baseline: parseFloat(avgMetrics.avgDeathsPerGame.toFixed(1)),
      goal: parseFloat(Math.max(avgMetrics.avgDeathsPerGame - 1.0, 1.0).toFixed(1)),
      unit: "",
      direction: "decrease",
      deficiency: Math.max(0, (avgMetrics.avgDeathsPerGame - 3.5) / 3.5),
    });
  }

  // CS/min — skip utility-like profiles (cs < 1.5 = no laning)
  if (avgMetrics.csPerMinute >= 1.5 && avgMetrics.csPerMinute < 7) {
    out.push({
      metric: "csPerMinute",
      label: "CS / Min",
      baseline: parseFloat(avgMetrics.csPerMinute.toFixed(1)),
      goal: parseFloat((avgMetrics.csPerMinute + 0.7).toFixed(1)),
      unit: "",
      direction: "increase",
      deficiency: Math.max(0, (7 - avgMetrics.csPerMinute) / 7),
    });
  }

  // Vision score
  if (avgVision < 25 && avgMetrics.csPerMinute >= 1.5) {
    out.push({
      metric: "visionScore",
      label: "Vision Score",
      baseline: parseFloat(avgVision.toFixed(0)),
      goal: parseFloat((avgVision + 5).toFixed(0)),
      unit: "",
      direction: "increase",
      deficiency: Math.max(0, (25 - avgVision) / 25),
    });
  }

  // KDA
  if (avgMetrics.kda < 3) {
    out.push({
      metric: "kda",
      label: "KDA",
      baseline: avgMetrics.kda,
      goal: parseFloat((avgMetrics.kda + 0.5).toFixed(2)),
      unit: "",
      direction: "increase",
      deficiency: Math.max(0, (3 - avgMetrics.kda) / 3),
    });
  }

  // Always ensure at least 1 target even for strong players
  if (out.length === 0) {
    out.push({
      metric: "winRate",
      label: "Win Rate",
      baseline: parseFloat(winRate.toFixed(1)),
      goal: parseFloat(Math.min(winRate + 5, 75).toFixed(1)),
      unit: "%",
      direction: "increase",
      deficiency: 0.1,
    });
  }

  return out.sort((a, b) => b.deficiency - a.deficiency).slice(0, 3);
}

// ── Progress computation ─────────────────────────────────────────────────────

function getCurrentValue(metric: PlanMetric, profile: PlayerPerformanceProfile): number {
  const last10 = profile.recentMatches.slice(0, 10);
  switch (metric) {
    case "winRate":
      return last10.length > 0
        ? parseFloat(((last10.filter((m) => m.won).length / last10.length) * 100).toFixed(1))
        : profile.winRate;
    case "kda":
      return profile.avgMetrics.kda;
    case "csPerMinute":
      return profile.avgMetrics.csPerMinute;
    case "visionScore":
      return last10.length > 0
        ? parseFloat((last10.reduce((s, m) => s + m.visionScore, 0) / last10.length).toFixed(0))
        : 0;
    case "deaths":
      return profile.avgMetrics.avgDeathsPerGame;
  }
}

function toProgress(target: ImprovementTarget, current: number): PlanProgress {
  const range = Math.abs(target.goal - target.baseline);
  const moved =
    target.direction === "increase"
      ? current - target.baseline
      : target.baseline - current;

  const progress = range === 0 ? 0 : Math.min(Math.max(moved / range, 0), 1);

  return {
    ...target,
    current: parseFloat(current.toFixed(target.metric === "kda" ? 2 : 1)),
    progress,
    achieved: progress >= 1,
  };
}

function buildPlanWithProgress(
  plan: { id: string; createdAt: Date; expiresAt: Date; status: string; targets: unknown },
  profile: PlayerPerformanceProfile
): PlanWithProgress {
  const targets = plan.targets as ImprovementTarget[];
  const now = Date.now();
  const daysLeft = Math.max(
    0,
    Math.ceil((plan.expiresAt.getTime() - now) / (1000 * 60 * 60 * 24))
  );
  const dayElapsed = PLAN_DAYS - daysLeft;
  const weekLabel = dayElapsed <= 7 ? "Week 1 of 2" : "Week 2 of 2";
  const isExpired = plan.expiresAt.getTime() < now || plan.status === "expired";

  const progresses = targets.map((t) =>
    toProgress(t, getCurrentValue(t.metric, profile))
  );

  return {
    id: plan.id,
    createdAt: plan.createdAt.toISOString(),
    expiresAt: plan.expiresAt.toISOString(),
    daysLeft,
    weekLabel,
    status: isExpired ? "expired" : "active",
    targets: progresses,
    allAchieved: progresses.length > 0 && progresses.every((p) => p.achieved),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getActivePlan(
  riotAccountId: string
): Promise<PlanWithProgress | null> {
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

export function computeWeeklyScore(progresses: PlanProgress[]): number {
  if (progresses.length === 0) return 0;
  const completed = progresses.filter((p) => p.achieved).length;
  const partial = progresses.filter((p) => !p.achieved && p.progress > 0.5).length;
  return Math.min(Math.round(completed * 33 + partial * 15), 100);
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
