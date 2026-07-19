import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { TEMPLATES, XP_PER_LEVEL } from "./challengeConstants";
import type { ChallengeMetric, ChallengeWithProgress } from "./challengeConstants";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";

export async function getActiveChallenges(userId: string): Promise<ChallengeWithProgress[]> {
  const now = new Date();
  const rows = await prisma.challenge.findMany({
    where: { userId, validFrom: { lte: now }, validUntil: { gte: now } },
    include: { userChallenges: { where: { userId } } },
    orderBy: { type: "asc" },
  });

  return rows.map((c) => {
    const uc = c.userChallenges[0];
    return {
      id: c.id, type: c.type, metric: c.metric, targetValue: c.targetValue,
      description: c.description, xpReward: c.xpReward, validFrom: c.validFrom, validUntil: c.validUntil,
      progress: uc?.progress ?? 0, completed: uc?.completed ?? false, completedAt: uc?.completedAt ?? null,
    };
  });
}

async function computeProgress(c: ChallengeWithProgress, riotAccountId: string): Promise<number> {
  const puuid = await getAccountPuuid(riotAccountId);
  const metric = c.metric as ChallengeMetric;
  const recentMatches = await prisma.matchParticipant.findMany({
    where: { puuid: puuid ?? "", match: { queueType: "RANKED_SOLO_5x5", gameStart: { gte: c.validFrom } } },
    select: { csPerMinute: true, deaths: true, visionScore: true, kills: true, assists: true, won: true },
    orderBy: { match: { gameStart: "asc" } },
    take: 20,
  });

  if (recentMatches.length === 0) return 0;

  const template = TEMPLATES[metric];

  if (metric === "win_streak") {
    let streak = 0;
    let best = 0;
    for (const m of recentMatches) {
      if (m.won) { streak++; best = Math.max(best, streak); }
      else streak = 0;
    }
    return Math.min(best / c.targetValue, 1.0);
  }

  let satisfying = 0;
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
    await prisma.user.update({ where: { id: userId }, data: { level: newLevel } });
    logger.info(`[challenges] User ${userId} leveled up to ${newLevel}`);
  }
}

export async function checkAndUpdateChallengeProgress(userId: string, riotAccountId: string): Promise<void> {
  const activeChallenges = await getActiveChallenges(userId);
  const incomplete = activeChallenges.filter((c) => !c.completed);
  if (incomplete.length === 0) return;

  for (const c of incomplete) {
    const newProgress = await computeProgress(c, riotAccountId);
    const completed = newProgress >= 1.0;

    await prisma.userChallenge.update({
      where: { userId_challengeId: { userId, challengeId: c.id } },
      data: { progress: newProgress, completed, completedAt: completed ? new Date() : null },
    });

    if (completed) {
      await awardXp(userId, c.xpReward);
      logger.info(`[challenges] User ${userId} completed challenge ${c.id} (+${c.xpReward} XP)`);
    }
  }
}

export async function getActiveChallengeStreak(userId: string): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const completed = await prisma.userChallenge.findMany({
    where: { userId, completed: true, completedAt: { gte: sevenDaysAgo }, challenge: { type: "daily" } },
    select: { completedAt: true },
    orderBy: { completedAt: "desc" },
  });

  const days = new Set(completed.map((c) => c.completedAt?.toISOString().slice(0, 10) ?? ""));
  let streak = 0;
  for (let i = 0; i < 7; i++) {
    const label = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (days.has(label)) streak++;
    else break;
  }
  return streak;
}

export async function getUserXpLevel(userId: string): Promise<{ xp: number; level: number; xpToNext: number }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true, level: true } });
  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;
  return { xp, level, xpToNext: XP_PER_LEVEL - (xp % XP_PER_LEVEL) };
}

export type { ChallengeWithProgress };
