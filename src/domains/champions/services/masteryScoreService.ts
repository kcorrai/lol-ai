import { prisma } from "@/lib/db/prisma";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MasteryTier = "Apprentice" | "Adept" | "Expert" | "Master" | "Legend";

export interface MasterySubScores {
  laning: number;
  vision: number;
  teamfight: number;
  objectiveCtrl: number;
  consistency: number;
  carry: number;
}

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

// ── Normalize helpers ─────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Maps [min, max] → [0, 100], clamped
function normalize(value: number, min: number, max: number): number {
  return Math.round(clamp((value - min) / (max - min), 0, 1) * 100);
}

// ── Per-dimension calculations ─────────────────────────────────────────────────

interface RawMatch {
  kills: number;
  deaths: number;
  assists: number;
  damageDealt: number;
  visionScore: number;
  objectivesStolen: number;
  turretsDestroyed: number;
  totalTimeCCDealt: number;
  gameDuration: number; // seconds
  won: boolean;
}

function computeLaning(avgCsPerMinute: number): number {
  // Reference: 3.0 cs/min (very poor) → 9.0 (elite)
  return normalize(avgCsPerMinute, 3.0, 9.0);
}

function computeVision(avgVisionScore: number): number {
  // Reference: 8 (no effort) → 45 (excellent)
  return normalize(avgVisionScore, 8, 45);
}

function computeTeamfight(matches: RawMatch[]): number {
  if (matches.length === 0) return 0;

  // Damage share: sum of per-game damage / some target (100k dmg = solid)
  // CC/min: totalTimeCCDealt / gameDurationMin — 0 → 5 range
  const scores = matches.map((m) => {
    const dmgScore = normalize(m.damageDealt, 5_000, 100_000);
    const gameMins = Math.max(m.gameDuration / 60, 1);
    const ccPerMin = m.totalTimeCCDealt / gameMins;
    const ccScore = normalize(ccPerMin, 0, 8);
    return Math.round((dmgScore * 0.7 + ccScore * 0.3));
  });

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function computeObjectiveCtrl(matches: RawMatch[]): number {
  if (matches.length === 0) return 0;

  // objectivesStolen (0-2 typical) + turretsDestroyed (0-5 typical)
  const scores = matches.map((m) => {
    const stolenScore = normalize(m.objectivesStolen, 0, 2);
    const turretScore = normalize(m.turretsDestroyed, 0, 3);
    return Math.round((stolenScore * 0.4 + turretScore * 0.6));
  });

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function computeConsistency(matches: RawMatch[]): number {
  if (matches.length < 3) return 50;

  const kdaValues = matches.map(
    (m) => (m.kills + m.assists) / Math.max(m.deaths, 1)
  );
  const mean = kdaValues.reduce((a, b) => a + b, 0) / kdaValues.length;
  const variance =
    kdaValues.reduce((s, v) => s + (v - mean) ** 2, 0) / kdaValues.length;
  const stdDev = Math.sqrt(variance);

  // Low std dev = consistent = high score. Range: 0 (perfect) → 3 (very inconsistent)
  return normalize(3 - stdDev, 0, 3);
}

function computeCarry(avgKda: number): number {
  // Reference: 1.0 (poor) → 6.0 (elite carry)
  return normalize(avgKda, 1.0, 6.0);
}

// ── Composite score ───────────────────────────────────────────────────────────

const WEIGHTS: Record<keyof MasterySubScores, number> = {
  laning: 0.20,
  vision: 0.15,
  teamfight: 0.20,
  objectiveCtrl: 0.15,
  consistency: 0.15,
  carry: 0.15,
};

function computeTotal(sub: MasterySubScores): number {
  return Math.round(
    sub.laning * WEIGHTS.laning +
    sub.vision * WEIGHTS.vision +
    sub.teamfight * WEIGHTS.teamfight +
    sub.objectiveCtrl * WEIGHTS.objectiveCtrl +
    sub.consistency * WEIGHTS.consistency +
    sub.carry * WEIGHTS.carry
  );
}

function scoreToTier(total: number): MasteryTier {
  if (total >= 85) return "Legend";
  if (total >= 70) return "Master";
  if (total >= 55) return "Expert";
  if (total >= 40) return "Adept";
  return "Apprentice";
}

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

  const matches = await prisma.matchParticipant.findMany({
    where: {
      riotAccountId,
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
      masterySubScores: subScores as unknown as object,
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
      subScores: stat.masterySubScores as unknown as MasterySubScores,
      tier: scoreToTier(stat.masteryScore),
      gamesAnalyzed: stat.gamesPlayed,
      computedAt: stat.masteryScoreAt!.toISOString(),
    };
  }

  return computeChampionMastery(riotAccountId, championId);
}
