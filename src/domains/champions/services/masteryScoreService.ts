import { prisma } from "@/lib/db/prisma";
import { toJsonInput, fromJsonValue } from "@/types/json";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";
import {
  type MasteryTier,
  type MasterySubScores,
  type RawMatch,
  computeLaning,
  computeVision,
  computeTeamfight,
  computeObjectiveCtrl,
  computeConsistency,
  computeCarry,
  computeTotal,
  scoreToTier,
} from "./masteryScoring";

export type { MasteryTier, MasterySubScores } from "./masteryScoring";

export interface ChampionMasteryScore {
  championId: number;
  championName: string;
  imageUrl: string;
  total: number;
  subScores: MasterySubScores;
  tier: MasteryTier;
  gamesAnalyzed: number;
  computedAt: string;
}

const MIN_GAMES = 5;

// ── Main compute function ─────────────────────────────────────────────────────

export async function computeChampionMastery(
  riotAccountId: string,
  championId: number
): Promise<ChampionMasteryScore | null> {
  const stat = await prisma.championStat.findUnique({
    where: {
      riotAccountId_championId_queueType: {
        riotAccountId,
        championId,
        queueType: "RANKED_SOLO_5x5",
      },
    },
    include: { champion: true },
  });

  if (!stat || stat.gamesPlayed < MIN_GAMES) return null;

  const puuid = await getAccountPuuid(riotAccountId);
  const matches = await prisma.matchParticipant.findMany({
    where: {
      puuid: puuid ?? "",
      championId,
      match: { queueType: "RANKED_SOLO_5x5" },
    },
    select: {
      kills: true,
      deaths: true,
      assists: true,
      damageDealt: true,
      visionScore: true,
      objectivesStolen: true,
      turretsDestroyed: true,
      totalTimeCCDealt: true,
      won: true,
      match: { select: { gameDuration: true } },
    },
    orderBy: { match: { gameStart: "desc" } },
    take: 30,
  });

  const raw: RawMatch[] = matches.map((m) => ({
    kills: m.kills,
    deaths: m.deaths,
    assists: m.assists,
    damageDealt: m.damageDealt,
    visionScore: m.visionScore,
    objectivesStolen: m.objectivesStolen,
    turretsDestroyed: m.turretsDestroyed,
    totalTimeCCDealt: m.totalTimeCCDealt,
    gameDuration: m.match.gameDuration,
    won: m.won,
  }));

  const subScores: MasterySubScores = {
    laning: computeLaning(Number(stat.avgCsPerMinute)),
    vision: computeVision(Number(stat.avgVisionScore)),
    teamfight: computeTeamfight(raw),
    objectiveCtrl: computeObjectiveCtrl(raw),
    consistency: computeConsistency(raw),
    carry: computeCarry(Number(stat.avgKda)),
  };

  const total = computeTotal(subScores);

  // Persist computed score back to champion_stats
  await prisma.championStat.update({
    where: { id: stat.id },
    data: {
      masteryScore: total,
      masterySubScores: toJsonInput(subScores),
      masteryScoreAt: new Date(),
    },
  });

  return {
    championId: stat.championId,
    championName: stat.champion.name,
    imageUrl: stat.champion.imageUrl,
    total,
    subScores,
    tier: scoreToTier(total),
    gamesAnalyzed: stat.gamesPlayed,
    computedAt: new Date().toISOString(),
  };
}

export async function getChampionMastery(
  riotAccountId: string,
  championId: number
): Promise<ChampionMasteryScore | null> {
  // Return cached score if computed within last 24h
  const stat = await prisma.championStat.findUnique({
    where: {
      riotAccountId_championId_queueType: {
        riotAccountId,
        championId,
        queueType: "RANKED_SOLO_5x5",
      },
    },
    include: { champion: true },
  });

  if (!stat || stat.gamesPlayed < MIN_GAMES) return null;

  const stale =
    !stat.masteryScoreAt ||
    Date.now() - stat.masteryScoreAt.getTime() > 24 * 60 * 60 * 1000;

  if (!stale && stat.masteryScore !== null && stat.masterySubScores !== null) {
    return {
      championId: stat.championId,
      championName: stat.champion.name,
      imageUrl: stat.champion.imageUrl,
      total: stat.masteryScore,
      subScores: fromJsonValue<MasterySubScores>(stat.masterySubScores),
      tier: scoreToTier(stat.masteryScore),
      gamesAnalyzed: stat.gamesPlayed,
      computedAt: stat.masteryScoreAt!.toISOString(),
    };
  }

  return computeChampionMastery(riotAccountId, championId);
}
