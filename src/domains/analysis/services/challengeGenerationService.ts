import { prisma } from "@/lib/db/prisma";
import { getAiClient } from "@/lib/ai/client";
import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import { logger } from "@/lib/utils/logger";
import type { Challenge } from "@prisma/client";
import { TEMPLATES, WEEKLY_MULTIPLIER } from "./challengeConstants";
import type { ChallengeMetric } from "./challengeConstants";

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
  const avgVision = recent.reduce((s, r) => s + r.visionScore, 0) / recent.length;
  const avgKda = recent.reduce((s, r) => s + (r.kills + r.assists) / Math.max(r.deaths, 1), 0) / recent.length;

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
    case "vision_score": avg = recent.reduce((s, r) => s + r.visionScore, 0) / recent.length; break;
    case "kda":          avg = recent.reduce((s, r) => s + (r.kills + r.assists) / Math.max(r.deaths, 1), 0) / recent.length; break;
    default: return template.defaultTarget;
  }

  if (metric === "deaths") return Math.max(1, Math.round((avg * 0.85) * 10) / 10);
  return Math.round((avg * 1.12) * 10) / 10;
}

async function buildDescription(metric: ChallengeMetric, targetValue: number, matchCount: number, type: "daily" | "weekly"): Promise<string> {
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

    const ai = getAiClient("lite");
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

export async function generateDailyChallenge(userId: string, riotAccountId: string): Promise<Challenge> {
  const validFrom = todayMidnight();
  const validUntil = nextMidnight();

  const existing = await prisma.challenge.findFirst({ where: { userId, type: "daily", validFrom } });
  if (existing) return existing;

  const metric = await pickWeakMetric(riotAccountId);
  const template = TEMPLATES[metric];
  const targetValue = await computeTarget(riotAccountId, metric);
  const description = await buildDescription(metric, targetValue, template.matchCount, "daily");

  const challenge = await prisma.challenge.create({
    data: { userId, type: "daily", metric, targetValue, description, xpReward: template.xp, validFrom, validUntil },
  });
  await prisma.userChallenge.create({ data: { userId, challengeId: challenge.id } });
  logger.info(`[challenges] Daily challenge created for ${userId}: ${metric} → ${targetValue}`);
  return challenge;
}

export async function generateWeeklyChallenge(userId: string, riotAccountId: string): Promise<Challenge> {
  const validFrom = todayMidnight();
  const validUntil = nextMonday();

  const existing = await prisma.challenge.findFirst({ where: { userId, type: "weekly", validFrom } });
  if (existing) return existing;

  const metric = await pickWeakMetric(riotAccountId);
  const template = TEMPLATES[metric];
  const targetValue = await computeTarget(riotAccountId, metric);
  const weeklyMatchCount = template.matchCount * WEEKLY_MULTIPLIER;
  const weeklyXp = template.xp * 3;
  const description = await buildDescription(metric, targetValue, weeklyMatchCount, "weekly");

  const challenge = await prisma.challenge.create({
    data: { userId, type: "weekly", metric, targetValue, description, xpReward: weeklyXp, validFrom, validUntil },
  });
  await prisma.userChallenge.create({ data: { userId, challengeId: challenge.id } });
  logger.info(`[challenges] Weekly challenge created for ${userId}: ${metric} → ${targetValue}`);
  return challenge;
}
