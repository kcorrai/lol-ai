import { prisma } from "@/lib/db/prisma";
import { getAiClient } from "@/lib/ai/client";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";

export type TiltLevel = "focused" | "caution" | "tilting";

export interface TiltStatus {
  level: TiltLevel;
  score: number;
  lossStreak: number;
  recentWinRate: number;
  kdaTrend: "improving" | "declining" | "stable";
  message: string;
  gamesAnalyzed: number;
}

const MESSAGES: Record<TiltLevel, string> = {
  focused: "You're in a good mental state. Keep playing.",
  caution: "Performance is dipping. Play one more game, then reassess.",
  tilting: "Take a break. Playing now will cost you LP, not earn it.",
};

export async function computeTiltStatus(riotAccountId: string): Promise<TiltStatus | null> {
  const puuid = await getAccountPuuid(riotAccountId);
  const matches = await prisma.matchParticipant.findMany({
    where: { puuid: puuid ?? "" },
    orderBy: { match: { gameStart: "desc" } },
    take: 10,
    select: {
      won: true,
      kills: true,
      deaths: true,
      assists: true,
    },
  });

  if (matches.length < 3) return null;

  // ── Loss streak (from most recent) ───────────────────────────────
  let lossStreak = 0;
  for (const m of matches) {
    if (!m.won) lossStreak++;
    else break;
  }

  // ── Win rate (last 10) ────────────────────────────────────────────
  const wins = matches.filter((m) => m.won).length;
  const recentWinRate = wins / matches.length;

  // ── KDA trend: last 3 vs last 7 ──────────────────────────────────
  const kda = (m: { kills: number; deaths: number; assists: number }) =>
    (m.kills + m.assists) / Math.max(m.deaths, 1);

  const last3 = matches.slice(0, 3);
  const last7 = matches.slice(0, Math.min(7, matches.length));
  const avgKda3 = last3.reduce((s, m) => s + kda(m), 0) / last3.length;
  const avgKda7 = last7.reduce((s, m) => s + kda(m), 0) / last7.length;

  let kdaTrend: TiltStatus["kdaTrend"] = "stable";
  if (avgKda3 < avgKda7 * 0.85) kdaTrend = "declining";
  else if (avgKda3 > avgKda7 * 1.15) kdaTrend = "improving";

  // ── Score ─────────────────────────────────────────────────────────
  let score = 0;

  if (lossStreak === 1) score += 10;
  else if (lossStreak === 2) score += 20;
  else if (lossStreak === 3) score += 35;
  else if (lossStreak >= 4) score += 50;

  if (recentWinRate < 0.4) score += 25;
  else if (recentWinRate < 0.5) score += 15;

  if (kdaTrend === "declining") score += 15;

  score = Math.min(score, 100);

  const level: TiltLevel = score <= 30 ? "focused" : score <= 60 ? "caution" : "tilting";

  return {
    level,
    score,
    lossStreak,
    recentWinRate,
    kdaTrend,
    message: MESSAGES[level],
    gamesAnalyzed: matches.length,
  };
}

export interface RecentMatchSnippet {
  championName: string;
  won: boolean;
  kills: number;
  deaths: number;
  assists: number;
}

export async function generateTiltRecoveryMessage(
  recentMatches: RecentMatchSnippet[]
): Promise<string> {
  const streak = recentMatches.filter((m) => !m.won).length;
  const avgDeaths =
    recentMatches.length > 0
      ? (recentMatches.reduce((s, m) => s + m.deaths, 0) / recentMatches.length).toFixed(1)
      : "?";
  const champs = recentMatches.map((m) => m.championName).join(", ");

  const ai = getAiClient("tilt-message");
  const result = await ai.complete(
    "You are an empathetic but direct League of Legends coach.",
    `The player lost ${streak} matches in a row. Champions: ${champs}. Average deaths: ${avgDeaths}.\n` +
      "Write a 2-sentence break recommendation in English. " +
      "State the statistical reality (e.g., 'In loss streaks, win rate is 15% lower'), " +
      "then give an actionable suggestion. Plain text only, no JSON.",
    { maxTokens: 120 }
  );

  return result.content.trim().replace(/^"|"$/g, "");
}
