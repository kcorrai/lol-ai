import { prisma } from "@/lib/db/prisma";
import {
  computeKDA,
  computeDamageShare,
  computeKillParticipation,
} from "@/domains/analysis/calculators/performanceCalculator";

export type ParticipantDetail = {
  id: string;
  riotAccountId: string | null;
  puuid: string;
  gameName: string | null;
  tagLine: string | null;
  championName: string;
  position: string;
  teamId: number;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  csPerMinute: number;
  goldEarned: number;
  goldPerMinute: number;
  damageDealt: number;
  damageTaken: number;
  visionScore: number;
  firstBlood: boolean;
  won: boolean;
  kda: number;
  damageShare: number;
  killParticipation: number;
  itemIds: number[];
  summonerSpell1: number;
  summonerSpell2: number;
  runePrimaryKeystone: number | null;
  runePrimaryPath: number | null;
  runeSecondaryPath: number | null;
  rankTier: string | null;
  rankDivision: string | null;
  rankLp: number | null;
};

export type AiInsight = {
  reportId: string;
  summary: string;
  strengths: unknown;
  weaknesses: unknown;
} | null;

export type TeamObjectives = {
  towers: number;
  dragons: number;
  barons: number;
  inhibitors: number;
  heralds: number;
};

export type MatchDetail = {
  id: string;
  matchId: string;
  gameMode: string;
  queueType: string;
  gameDuration: number;
  gameStart: string;
  winningTeam: number;
  teamObjectives: Record<string, TeamObjectives> | null;
  participants: ParticipantDetail[];
  userRiotAccountId: string | null;
  aiInsight: AiInsight;
};

export async function getMatchDetail(
  matchDbId: string,
  userId: string
): Promise<MatchDetail | null> {
  const [riotAccounts, match] = await Promise.all([
    prisma.riotAccount.findMany({
      where: { userId },
      select: { id: true, gameName: true, tagLine: true },
    }),
    prisma.match.findUnique({
      where: { id: matchDbId },
      include: { participants: true },
    }),
  ]);

  if (!match) return null;

  const accountIds = new Set(riotAccounts.map((a) => a.id));

  // Only expose matches the user participated in (any of their linked accounts)
  const userParticipant = match.participants.find(
    (p) => p.riotAccountId !== null && accountIds.has(p.riotAccountId)
  );
  if (!userParticipant) return null;

  const userAccount = riotAccounts.find((a) => a.id === userParticipant.riotAccountId) ?? riotAccounts[0] ?? null;

  // Fetch user's latest rank to enrich their participant row (others don't have stored rank)
  const latestUserRank = userAccount
    ? await prisma.rankedHistory.findFirst({
        where: { riotAccountId: userAccount.id, queueType: "RANKED_SOLO_5x5" },
        orderBy: { recordedAt: "desc" },
        select: { tier: true, division: true, lp: true },
      })
    : null;

  // Aggregate team totals for share calculations
  const teamTotals = new Map<number, { damage: number; kills: number }>();
  for (const p of match.participants) {
    const t = teamTotals.get(p.teamId) ?? { damage: 0, kills: 0 };
    t.damage += p.damageDealt;
    t.kills += p.kills;
    teamTotals.set(p.teamId, t);
  }

  const isUserParticipant = (p: { riotAccountId: string | null }) =>
    p.riotAccountId !== null && accountIds.has(p.riotAccountId);

  const participants: ParticipantDetail[] = match.participants.map((p) => {
    const team = teamTotals.get(p.teamId) ?? { damage: 1, kills: 0 };
    const isUser = isUserParticipant(p);
    return {
      id: p.id,
      riotAccountId: p.riotAccountId,
      puuid: p.puuid,
      gameName: p.gameName ?? null,
      tagLine: p.tagLine ?? null,
      championName: p.championName,
      position: p.position,
      teamId: p.teamId,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      cs: p.cs,
      csPerMinute: Number(p.csPerMinute),
      goldEarned: p.goldEarned,
      goldPerMinute: Number(p.goldPerMinute),
      damageDealt: p.damageDealt,
      damageTaken: p.damageTaken,
      visionScore: p.visionScore,
      firstBlood: p.firstBlood,
      won: p.won,
      kda: computeKDA(p.kills, p.deaths, p.assists),
      damageShare: computeDamageShare(p.damageDealt, team.damage),
      killParticipation: computeKillParticipation(p.kills, p.assists, team.kills),
      itemIds: p.itemIds,
      summonerSpell1: p.summonerSpell1,
      summonerSpell2: p.summonerSpell2,
      runePrimaryKeystone: p.runePrimaryKeystone,
      runePrimaryPath: p.runePrimaryPath,
      runeSecondaryPath: p.runeSecondaryPath,
      rankTier: isUser ? (latestUserRank?.tier ?? p.rankTier ?? null) : (p.rankTier ?? null),
      rankDivision: isUser ? (latestUserRank?.division ?? p.rankDivision ?? null) : (p.rankDivision ?? null),
      rankLp: isUser ? (latestUserRank?.lp ?? p.rankLp ?? null) : (p.rankLp ?? null),
    };
  });

  const aiInsightRow = await prisma.coachingReport.findFirst({
    where: {
      riotAccount: { userId },
      matchesAnalyzed: { has: matchDbId },
      status: "complete",
    },
    select: { id: true, summary: true, strengths: true, weaknesses: true },
  });

  const aiInsight: AiInsight = aiInsightRow?.summary
    ? {
        reportId: aiInsightRow.id,
        summary: aiInsightRow.summary,
        strengths: aiInsightRow.strengths,
        weaknesses: aiInsightRow.weaknesses,
      }
    : null;

  return {
    id: match.id,
    matchId: match.matchId,
    gameMode: match.gameMode,
    queueType: match.queueType,
    gameDuration: match.gameDuration,
    gameStart: match.gameStart.toISOString(),
    winningTeam: match.winningTeam,
    teamObjectives: (match.teamObjectives as Record<string, TeamObjectives> | null) ?? null,
    participants,
    userRiotAccountId: userAccount?.id ?? null,
    aiInsight,
  };
}
