import { prisma } from "@/lib/db/prisma";
import { getCurrentRank } from "@/domains/riot";
import type { RankUpResult, RankUpLevel, RankUpComponents } from "@/domains/analysis/types/analysis.types";

const LP_GAIN = 20;
const LP_LOSS = 16;

const TIER_ORDER = [
  "IRON", "BRONZE", "SILVER", "GOLD",
  "PLATINUM", "EMERALD", "DIAMOND", "MASTER",
] as const;
type Tier = typeof TIER_ORDER[number];

const APEX_TIERS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

function nextLabel(tier: string, division: string): string {
  if (APEX_TIERS.has(tier)) return "next LP milestone";
  if (division === "I") {
    const idx = TIER_ORDER.indexOf(tier as Tier);
    const next = idx >= 0 && idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null;
    return next ? `${next} IV` : "Master";
  }
  const divMap: Record<string, string> = { IV: "III", III: "II", II: "I" };
  return `${tier} ${divMap[division] ?? "I"}`;
}

function winRatePts(wr: number): number {
  if (wr >= 0.60) return 35;
  if (wr >= 0.55) return 28;
  if (wr >= 0.50) return 20;
  if (wr >= 0.45) return 10;
  return 0;
}

function trendFromMatches(matches: { won: boolean }[]): "improving" | "stable" | "declining" {
  if (matches.length < 10) return "stable";
  const recent = matches.slice(0, 5);
  const older = matches.slice(5, 10);
  const r = recent.filter((m) => m.won).length / 5;
  const o = older.filter((m) => m.won).length / 5;
  if (r > o + 0.15) return "improving";
  if (r < o - 0.15) return "declining";
  return "stable";
}

function mentalPts(matches: { won: boolean }[]): number {
  let streak = 0;
  for (const m of matches) {
    if (!m.won) streak++;
    else break;
  }
  if (streak >= 3) return 0;
  if (streak === 2) return 8;
  if (streak === 1) return 12;
  return 15;
}

function buildMessage(level: RankUpLevel, estimated: number | null, atRisk: boolean): string {
  if (atRisk) return "Struggling right now — work on consistency before grinding LP.";
  if (level === "high" && estimated !== null) return `You're on track — ~${estimated} games to rank up at this rate.`;
  if (level === "high") return "Strong performance. Keep the consistency.";
  if (level === "moderate" && estimated !== null) return `Possible in ~${estimated} games — maintain your current form.`;
  if (level === "moderate") return "You have a path up, but consistency will be key.";
  return "Focus on fundamentals to build momentum before grinding.";
}

export async function getRankUpProbability(riotAccountId: string): Promise<RankUpResult | null> {
  const rank = await getCurrentRank(riotAccountId, "RANKED_SOLO_5x5");
  if (!rank) return null;

  // Last 20 ranked solo matches for WR / trend / mental
  const recentRanked = await prisma.matchParticipant.findMany({
    where: {
      riotAccountId,
      match: { queueType: "RANKED_SOLO_5x5" },
    },
    orderBy: { match: { gameStart: "desc" } },
    take: 20,
    select: { won: true },
  });

  if (recentRanked.length < 5) return null;

  const recentWinRate = recentRanked.filter((m) => m.won).length / recentRanked.length;
  const trend = trendFromMatches(recentRanked);

  const lpProximity = Math.round((rank.lp / 100) * 30);
  const wrPts = winRatePts(recentWinRate);
  const trendPts = trend === "improving" ? 20 : trend === "stable" ? 10 : 0;
  const mentalScore = mentalPts(recentRanked);

  const components: RankUpComponents = {
    lpProximity,
    winRate: wrPts,
    trend: trendPts,
    mental: mentalScore,
  };

  const score = Math.min(lpProximity + wrPts + trendPts + mentalScore, 100);
  const level: RankUpLevel = score >= 65 ? "high" : score >= 40 ? "moderate" : "low";

  const lpToNext = APEX_TIERS.has(rank.tier) ? null : 100 - rank.lp;
  const expectedLPPerGame = recentWinRate * LP_GAIN + (1 - recentWinRate) * -LP_LOSS;
  const atRisk = expectedLPPerGame < 0;

  let estimatedGames: number | null = null;
  if (lpToNext !== null && expectedLPPerGame > 0) {
    estimatedGames = Math.max(1, Math.ceil(lpToNext / expectedLPPerGame));
  }

  return {
    score,
    level,
    estimatedGames,
    currentLP: rank.lp,
    lpToNext: lpToNext ?? rank.lp,
    nextLabel: nextLabel(rank.tier, rank.division),
    recentWinRate,
    trend,
    components,
    message: buildMessage(level, estimatedGames, atRisk),
    atRisk,
  };
}
