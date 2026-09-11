import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { ACHIEVEMENT_CATALOG } from "@/types/achievement";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";

const TIER_ORDER: Record<string, number> = {
  IRON: 0,
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  PLATINUM: 4,
  EMERALD: 5,
  DIAMOND: 6,
  MASTER: 7,
  GRANDMASTER: 8,
  CHALLENGER: 9,
};
const DIV_ORDER: Record<string, number> = { IV: 0, III: 1, II: 2, I: 3 };

function toAbsLp(tier: string, division: string, lp: number): number {
  return ((TIER_ORDER[tier] ?? 0) * 4 + (DIV_ORDER[division] ?? 0)) * 100 + lp;
}

async function checkCsMachine(riotAccountId: string): Promise<boolean> {
  const puuid = await getAccountPuuid(riotAccountId);
  const recent = await prisma.matchParticipant.findMany({
    where: { puuid: puuid ?? "", match: { queueType: "RANKED_SOLO_5x5" } },
    orderBy: { match: { gameStart: "desc" } },
    take: 3,
    select: { csPerMinute: true },
  });
  return recent.length === 3 && recent.every((p) => Number(p.csPerMinute) >= 7.0);
}

async function checkDeathless(riotAccountId: string): Promise<boolean> {
  const puuid = await getAccountPuuid(riotAccountId);
  const recent = await prisma.matchParticipant.findMany({
    where: { puuid: puuid ?? "" },
    orderBy: { match: { gameStart: "desc" } },
    take: 5,
    select: { deaths: true },
  });
  return recent.length === 5 && recent.every((p) => p.deaths <= 2);
}

async function checkRisingStar(riotAccountId: string): Promise<boolean> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const history = await prisma.rankedHistory.findMany({
    where: { riotAccountId, queueType: "RANKED_SOLO_5x5", recordedAt: { gte: sevenDaysAgo } },
    orderBy: { recordedAt: "asc" },
    select: { tier: true, division: true, lp: true },
  });
  if (history.length < 2) return false;
  const first = history[0];
  const last = history[history.length - 1];
  return (
    toAbsLp(last.tier, last.division, last.lp) - toAbsLp(first.tier, first.division, first.lp) >= 50
  );
}

async function checkOnFire(riotAccountId: string): Promise<boolean> {
  const puuid = await getAccountPuuid(riotAccountId);
  const recent = await prisma.matchParticipant.findMany({
    where: { puuid: puuid ?? "" },
    orderBy: { match: { gameStart: "desc" } },
    take: 5,
    select: { won: true },
  });
  return recent.length === 5 && recent.every((p) => p.won);
}

async function checkHabitBreaker(riotAccountId: string): Promise<boolean> {
  const resolved = await prisma.playerHabit.findFirst({
    where: { riotAccountId, isResolved: true },
  });
  return resolved !== null;
}

async function checkOtpApprentice(riotAccountId: string): Promise<boolean> {
  const stat = await prisma.championStat.findFirst({
    where: { riotAccountId, gamesPlayed: { gte: 50 } },
    orderBy: { gamesPlayed: "desc" },
  });
  return stat !== null;
}

async function checkOtpMaster(riotAccountId: string): Promise<boolean> {
  const stat = await prisma.championStat.findFirst({
    where: { riotAccountId, gamesPlayed: { gte: 100 } },
    orderBy: { gamesPlayed: "desc" },
  });
  return stat !== null;
}

async function checkVisionWard(riotAccountId: string): Promise<boolean> {
  const puuid = await getAccountPuuid(riotAccountId);
  const recent = await prisma.matchParticipant.findMany({
    where: { puuid: puuid ?? "" },
    orderBy: { match: { gameStart: "desc" } },
    take: 3,
    select: { visionScore: true },
  });
  return recent.length === 3 && recent.every((p) => p.visionScore >= 10);
}

async function checkComebackKing(riotAccountId: string): Promise<boolean> {
  const puuid = await getAccountPuuid(riotAccountId);
  const recent = await prisma.matchParticipant.findMany({
    where: { puuid: puuid ?? "" },
    orderBy: { match: { gameStart: "desc" } },
    take: 20,
    select: { won: true },
  });
  // Chronological order (oldest first)
  const results = recent.map((p) => p.won).reverse();
  for (let i = 0; i <= results.length - 6; i++) {
    const threeLosses = !results[i] && !results[i + 1] && !results[i + 2];
    const threeWins = results[i + 3] && results[i + 4] && results[i + 5];
    if (threeLosses && threeWins) return true;
  }
  return false;
}

async function checkFirstReport(riotAccountId: string): Promise<boolean> {
  // Existence, not content. Unprojected this pulled the whole report — summary,
  // coachPersonaResponse, and the four Json columns — to answer a boolean.
  const report = await prisma.coachingReport.findFirst({
    where: { riotAccountId, status: "complete" },
    select: { id: true },
  });
  return report !== null;
}

async function checkWeekWarrior(riotAccountId: string): Promise<boolean> {
  const puuid = await getAccountPuuid(riotAccountId);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const matches = await prisma.matchParticipant.findMany({
    where: { puuid: puuid ?? "", match: { gameStart: { gte: thirtyDaysAgo } } },
    select: { match: { select: { gameStart: true } } },
    orderBy: { match: { gameStart: "asc" } },
  });
  for (let i = 0; i < matches.length; i++) {
    const windowEnd = new Date(matches[i].match.gameStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const count = matches.filter((m) => m.match.gameStart <= windowEnd).length - i;
    if (count >= 20) return true;
  }
  return false;
}

async function checkImprovementPlan(riotAccountId: string): Promise<boolean> {
  // Existence, not content — same reason `checkFirstReport` projects: unprojected this pulled
  // the plan's `targets` JSON across the wire to answer a boolean.
  const plan = await prisma.improvementPlan.findFirst({
    where: { riotAccountId },
    select: { id: true },
  });
  return plan !== null;
}

const CHECKERS: Record<string, (riotAccountId: string) => Promise<boolean>> = {
  cs_machine: checkCsMachine,
  deathless: checkDeathless,
  rising_star: checkRisingStar,
  on_fire: checkOnFire,
  habit_breaker: checkHabitBreaker,
  otp_apprentice: checkOtpApprentice,
  otp_master: checkOtpMaster,
  vision_ward: checkVisionWard,
  comeback_king: checkComebackKing,
  first_report: checkFirstReport,
  week_warrior: checkWeekWarrior,
  improvement_plan: checkImprovementPlan,
};

export async function checkAndAwardAchievements(
  userId: string,
  riotAccountId: string
): Promise<string[]> {
  const earned = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const earnedSet = new Set(earned.map((e) => e.achievementId));

  // Run together rather than one after another. The checkers are independent — each reads the
  // player's own history and none can influence another's answer — but awaited in a loop they
  // queued about two dozen round trips end to end, six of which were the same account lookup
  // repeated. Awarding concurrently is safe because the catalogue visits each id exactly once,
  // so no two of these writes can collide.
  const results = await Promise.all(
    ACHIEVEMENT_CATALOG.map(async (entry) => {
      if (earnedSet.has(entry.id)) return null;
      const checker = CHECKERS[entry.id];
      if (!checker) return null;

      try {
        if (!(await checker(riotAccountId))) return null;

        await prisma.userAchievement.create({
          data: { userId, achievementId: entry.id },
        });
        logger.info(`[achievements] Awarded "${entry.id}" to user ${userId}`);
        return entry.id;
      } catch (err) {
        // One failing checker must not cost the player the other eleven, which is what the
        // per-entry catch bought when this was a loop. Promise.all would reject on the first
        // rejection, so the catch has to stay inside.
        logger.warn(
          `[achievements] Checker failed for "${entry.id}": ${err instanceof Error ? err.message : String(err)}`
        );
        return null;
      }
    })
  );

  // Catalogue order, which is the order the loop awarded in.
  return results.filter((id): id is string => id !== null);
}
