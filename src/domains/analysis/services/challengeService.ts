import { prisma } from "@/lib/db/prisma";
import { getAiClient } from "@/lib/ai/client";
import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import { logger } from "@/lib/utils/logger";
import type { Challenge } from "@prisma/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type ChallengeMetric = "cs_per_min" | "deaths" | "vision_score" | "win_streak" | "kda";

interface ChallengeTemplate {
  xp: number;
  matchCount: number;
  defaultTarget: number;
}

interface ChallengeWithProgress {
  id: string;
  type: string;
  metric: string;
  targetValue: number;
  description: string;
  xpReward: number;
  validFrom: Date;
  validUntil: Date;
  progress: number;
  completed: boolean;
  completedAt: Date | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const XP_PER_LEVEL = 500;

const TEMPLATES: Record<ChallengeMetric, ChallengeTemplate> = {
  cs_per_min:   { xp: 50,  matchCount: 3, defaultTarget: 6.5 },
  deaths:       { xp: 60,  matchCount: 3, defaultTarget: 4.0 },
  vision_score: { xp: 40,  matchCount: 3, defaultTarget: 25.0 },
  win_streak:   { xp: 80,  matchCount: 3, defaultTarget: 3.0 },
  kda:          { xp: 50,  matchCount: 3, defaultTarget: 2.5 },
};

const WEEKLY_MULTIPLIER = 3;

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayMidnight(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function nextMidnight(): Date {
  const d = todayMidnight();
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

function nextMonday(): Date {
  const d = todayMidnight();
  const day = d.getUTCDay();
  const daysUntilMonday = ((1 - day + 7) % 7) || 7;
  d.setUTCDate(d.getUTCDate() + daysUntilMonday);
  return d;
}

// Pick the metric where the player is weakest relative to baseline.
async function pickWeakMetric(riotAccountId: string): Promise<ChallengeMetric> {
  const recent = await prisma.matchParticipant.findMany({
    where: { riotAccountId, match: { queueType: "RANKED_SOLO_5x5" } },
    select: { csPerMinute: true, deaths: true, visionScore: true, kills: true, assists: true },
    orderBy: { match: { gameStart: "desc" } },
    take: 10,
  });

  if (recent.length === 0) return "cs_per_min";

  const avgCs = recent.reduce((s, r) => s + Number(r.csPerMinute), 0) / recent.length;
  const avgDeaths = recent.reduce((s, r) => s + r.deaths, 0) / recent.length;
  const avgVision = recent.reduce((s, r) => s + (r.visionScore), 0) / recent.length;
  const avgKda = recent.reduce((s, r) => s + (r.kills + r.assists) / Math.max(r.deaths, 1), 0) / recent.length;

  // Score each metric: 0=worst, 1=best against threshold
  const scores: Record<ChallengeMetric, number> = {
    cs_per_min:   avgCs / 7.0,
    deaths:       1 - avgDeaths / 6.0,
    vision_score: avgVision / 30.0,
    win_streak:   0.5,
    kda:          avgKda / 3.0,
  };

  return (Object.entries(scores) as [ChallengeMetric, number][])
    .sort((a, b) => a[1] - b[1])[0][0];
}

// Compute target 10-15% above current average for the metric.
async function computeTarget(riotAccountId: string, metric: ChallengeMetric): Promise<number> {
  const template = TEMPLATES[metric];
  const recent = await prisma.matchParticipant.findMany({
    where: { riotAccountId, match: { queueType: "RANKED_SOLO_5x5" } },
    select: { csPerMinute: true, deaths: true, visionScore: true, kills: true, assists: true },
    orderBy: { match: { gameStart: "desc" } },
    take: 14,
  });

  if (recent.length === 0) return template.defaultTarget;

  let avg: number;
  switch (metric) {
    case "cs_per_min":   avg = recent.reduce((s, r) => s + Number(r.csPerMinute), 0) / recent.length; break;
    case "deaths":       avg = recent.reduce((s, r) => s + r.deaths, 0) / recent.length; break;
    case "vision_score": avg = recent.reduce((s, r) => s + (r.visionScore), 0) / recent.length; break;
    case "kda":          avg = recent.reduce((s, r) => s + (r.kills + r.assists) / Math.max(r.deaths, 1), 0) / recent.length; break;
    default: return template.defaultTarget;
  }

  if (metric === "deaths") {
    return Math.max(1, Math.round((avg * 0.85) * 10) / 10);
  }
  return Math.round((avg * 1.12) * 10) / 10;
}

async function buildDescription(
  metric: ChallengeMetric,
  targetValue: number,
  matchCount: number,
  type: "daily" | "weekly"
): Promise<string> {
  const metricLabel: Record<ChallengeMetric, string> = {
    cs_per_min:   `${targetValue}+ CS/dk`,
    deaths:       `${targetValue} veya daha az ölüm`,
    vision_score: `${targetValue}+ vision score`,
    win_streak:   `${matchCount} galibiyet serisi`,
    kda:          `${targetValue}+ KDA`,
  };

  const base = `${matchCount} maçta ${metricLabel[metric]}`;
  if (metric === "win_streak") return `${matchCount} üst üste galibiyet kazan`;

  try {
    const cacheKey = buildCacheKey("challenge-desc", { metric, target: String(targetValue), type });
    const cached = await getCached(cacheKey);
    if (cached && typeof cached === "string") return cached;

    const ai = getAiClient();
    const system = "Sen bir League of Legends koçusun. Kısa, motive edici Türkçe görev açıklamaları yazıyorsun.";
    const userMsg = `${type === "daily" ? "Günlük" : "Haftalık"} görev: "${base}". Türkçe, max 2 cümle, motive edici açıklama yaz.`;
    const result = await ai.complete(system, userMsg, { maxTokens: 120 });
    const desc = result.content.trim() || base;
    await setCached(cacheKey, "challenge-desc", desc, 7);
    return desc;
  } catch {
    return base;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function generateDailyChallenge(userId: string, riotAccountId: string): Promise<Challenge> {
  const validFrom = todayMidnight();
  const validUntil = nextMidnight();

  const existing = await prisma.challenge.findFirst({
    where: { userId, type: "daily", validFrom },
  });
  if (existing) return existing;

  const metric = await pickWeakMetric(riotAccountId);
  const template = TEMPLATES[metric];
  const targetValue = await computeTarget(riotAccountId, metric);
  const description = await buildDescription(metric, targetValue, template.matchCount, "daily");

  const challenge = await prisma.challenge.create({
    data: {
      userId,
      type: "daily",
      metric,
      targetValue,
      description,
      xpReward: template.xp,
      validFrom,
      validUntil,
    },
  });

  await prisma.userChallenge.create({
    data: { userId, challengeId: challenge.id },
  });

  logger.info(`[challenges] Daily challenge created for ${userId}: ${metric} → ${targetValue}`);
  return challenge;
}

export async function generateWeeklyChallenge(userId: string, riotAccountId: string): Promise<Challenge> {
  const validFrom = todayMidnight();
  const validUntil = nextMonday();

  const existing = await prisma.challenge.findFirst({
    where: { userId, type: "weekly", validFrom },
  });
  if (existing) return existing;

  const metric = await pickWeakMetric(riotAccountId);
  const template = TEMPLATES[metric];
  const targetValue = await computeTarget(riotAccountId, metric);
  const weeklyMatchCount = template.matchCount * WEEKLY_MULTIPLIER;
  const weeklyXp = template.xp * 3;
  const description = await buildDescription(metric, targetValue, weeklyMatchCount, "weekly");

  const challenge = await prisma.challenge.create({
    data: {
      userId,
      type: "weekly",
      metric,
      targetValue,
      description,
      xpReward: weeklyXp,
      validFrom,
      validUntil,
    },
  });

  await prisma.userChallenge.create({
    data: { userId, challengeId: challenge.id },
  });

  logger.info(`[challenges] Weekly challenge created for ${userId}: ${metric} → ${targetValue}`);
  return challenge;
}

export async function getActiveChallenges(userId: string): Promise<ChallengeWithProgress[]> {
  const now = new Date();
  const rows = await prisma.challenge.findMany({
    where: {
      userId,
      validFrom: { lte: now },
      validUntil: { gte: now },
    },
    include: { userChallenges: { where: { userId } } },
    orderBy: { type: "asc" },
  });

  return rows.map((c) => {
    const uc = c.userChallenges[0];
    return {
      id: c.id,
      type: c.type,
      metric: c.metric,
      targetValue: c.targetValue,
      description: c.description,
      xpReward: c.xpReward,
      validFrom: c.validFrom,
      validUntil: c.validUntil,
      progress: uc?.progress ?? 0,
      completed: uc?.completed ?? false,
      completedAt: uc?.completedAt ?? null,
    };
  });
}

export async function checkAndUpdateChallengeProgress(
  userId: string,
  riotAccountId: string
): Promise<void> {
  const activeChallenges = await getActiveChallenges(userId);
  const incomplete = activeChallenges.filter((c) => !c.completed);
  if (incomplete.length === 0) return;

  for (const c of incomplete) {
    const newProgress = await computeProgress(c, riotAccountId);
    const completed = newProgress >= 1.0;

    await prisma.userChallenge.update({
      where: { userId_challengeId: { userId, challengeId: c.id } },
      data: {
        progress: newProgress,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    if (completed) {
      await awardXp(userId, c.xpReward);
      logger.info(`[challenges] User ${userId} completed challenge ${c.id} (+${c.xpReward} XP)`);
    }
  }
}

async function computeProgress(c: ChallengeWithProgress, riotAccountId: string): Promise<number> {
  const since = c.validFrom;
  const metric = c.metric as ChallengeMetric;

  const recentMatches = await prisma.matchParticipant.findMany({
    where: {
      riotAccountId,
      match: { queueType: "RANKED_SOLO_5x5", gameStart: { gte: since } },
    },
    select: {
      csPerMinute: true, deaths: true, visionScore: true,
      kills: true, assists: true, won: true,
    },
    orderBy: { match: { gameStart: "asc" } },
    take: 20,
  });

  if (recentMatches.length === 0) return 0;

  const template = TEMPLATES[metric];
  let satisfying = 0;

  if (metric === "win_streak") {
    let streak = 0;
    let best = 0;
    for (const m of recentMatches) {
      if (m.won) { streak++; best = Math.max(best, streak); }
      else streak = 0;
    }
    return Math.min(best / c.targetValue, 1.0);
  }

  for (const m of recentMatches) {
    let val: number;
    switch (metric) {
      case "cs_per_min":   val = Number(m.csPerMinute); break;
      case "deaths":       val = m.deaths; break;
      case "vision_score": val = m.visionScore; break;
      case "kda":          val = (m.kills + m.assists) / Math.max(m.deaths, 1); break;
      default: continue;
    }

    const met = metric === "deaths" ? val <= c.targetValue : val >= c.targetValue;
    if (met) satisfying++;
  }

  return Math.min(satisfying / template.matchCount, 1.0);
}

async function awardXp(userId: string, amount: number): Promise<void> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: amount } },
    select: { xp: true, level: true },
  });
  const newLevel = Math.floor(user.xp / XP_PER_LEVEL) + 1;
  if (newLevel !== user.level) {
    await prisma.user.update({
      where: { id: userId },
      data: { level: newLevel },
    });
    logger.info(`[challenges] User ${userId} leveled up to ${newLevel}`);
  }
}

export async function getActiveChallengeStreak(userId: string): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const completed = await prisma.userChallenge.findMany({
    where: {
      userId,
      completed: true,
      completedAt: { gte: sevenDaysAgo },
      challenge: { type: "daily" },
    },
    select: { completedAt: true },
    orderBy: { completedAt: "desc" },
  });

  const days = new Set(
    completed.map((c) => c.completedAt?.toISOString().slice(0, 10) ?? "")
  );
  let streak = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const label = d.toISOString().slice(0, 10);
    if (days.has(label)) streak++;
    else break;
  }
  return streak;
}

export async function getUserXpLevel(userId: string): Promise<{ xp: number; level: number; xpToNext: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, level: true },
  });
  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  return { xp, level, xpToNext: XP_PER_LEVEL - xpInLevel };
}

export type { ChallengeWithProgress };
