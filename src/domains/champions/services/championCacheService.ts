import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";
import type { QueueType } from "@prisma/client";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Recomputes ChampionStat rows from match_participants for a given account.
// Called after each successful sync so champion stats page reads from pre-computed cache.
export async function refreshChampionStats(
  riotAccountId: string,
  queueType: QueueType = "RANKED_SOLO_5x5"
): Promise<void> {
  // Aggregate from match data by puuid (shared across users who linked this account), but store the
  // resulting ChampionStat rows per riotAccountId (TASK-228).
  const puuid = await getAccountPuuid(riotAccountId);
  if (!puuid) return;

  const participants = await prisma.matchParticipant.findMany({
    where: { puuid, match: { queueType } },
    select: {
      championId: true,
      kills: true,
      deaths: true,
      assists: true,
      cs: true,
      csPerMinute: true,
      won: true,
      visionScore: true,
      damageDealt: true,
      goldPerMinute: true,
    },
  });

  if (participants.length === 0) return;

  type AggRow = {
    games: number;
    wins: number;
    kills: number;
    deaths: number;
    assists: number;
    csSum: number;
    csPerMin: number;
    vision: number;
    damage: number;
    gold: number;
  };

  const agg = new Map<number, AggRow>();

  for (const p of participants) {
    const existing = agg.get(p.championId);
    const base = existing ?? {
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      csSum: 0,
      csPerMin: 0,
      vision: 0,
      damage: 0,
      gold: 0,
    };

    agg.set(p.championId, {
      games: base.games + 1,
      wins: base.wins + (p.won ? 1 : 0),
      kills: base.kills + p.kills,
      deaths: base.deaths + p.deaths,
      assists: base.assists + p.assists,
      csSum: base.csSum + p.cs,
      csPerMin: base.csPerMin + Number(p.csPerMinute),
      vision: base.vision + p.visionScore,
      damage: base.damage + p.damageDealt,
      gold: base.gold + Number(p.goldPerMinute),
    });
  }

  const now = new Date();

  await Promise.all(
    Array.from(agg.entries()).map(([championId, s]) => {
      const avgKda = (s.kills + s.assists) / Math.max(s.deaths, 1);

      return prisma.championStat.upsert({
        where: { riotAccountId_championId_queueType: { riotAccountId, championId, queueType } },
        create: {
          riotAccountId,
          championId,
          queueType,
          gamesPlayed: s.games,
          wins: s.wins,
          losses: s.games - s.wins,
          avgKda: Number(avgKda.toFixed(2)),
          avgKills: Number((s.kills / s.games).toFixed(2)),
          avgDeaths: Number((s.deaths / s.games).toFixed(2)),
          avgAssists: Number((s.assists / s.games).toFixed(2)),
          avgCs: Number((s.csSum / s.games).toFixed(2)),
          avgCsPerMinute: Number((s.csPerMin / s.games).toFixed(2)),
          avgVisionScore: Number((s.vision / s.games).toFixed(2)),
          avgDamageDealt: Number((s.damage / s.games).toFixed(2)),
          avgGoldPerMin: Number((s.gold / s.games).toFixed(2)),
          computedAt: now,
        },
        update: {
          gamesPlayed: s.games,
          wins: s.wins,
          losses: s.games - s.wins,
          avgKda: Number(avgKda.toFixed(2)),
          avgKills: Number((s.kills / s.games).toFixed(2)),
          avgDeaths: Number((s.deaths / s.games).toFixed(2)),
          avgAssists: Number((s.assists / s.games).toFixed(2)),
          avgCs: Number((s.csSum / s.games).toFixed(2)),
          avgCsPerMinute: Number((s.csPerMin / s.games).toFixed(2)),
          avgVisionScore: Number((s.vision / s.games).toFixed(2)),
          avgDamageDealt: Number((s.damage / s.games).toFixed(2)),
          avgGoldPerMin: Number((s.gold / s.games).toFixed(2)),
          computedAt: now,
        },
      });
    })
  );

  logger.info("[championCache] refreshed", { riotAccountId, champions: agg.size });
}

// Returns true if cached stats are fresh enough to use
export async function hasFreshCachedStats(
  riotAccountId: string,
  queueType: QueueType = "RANKED_SOLO_5x5"
): Promise<boolean> {
  const latest = await prisma.championStat.findFirst({
    where: { riotAccountId, queueType },
    orderBy: { computedAt: "desc" },
    select: { computedAt: true },
  });
  if (!latest) return false;
  return Date.now() - latest.computedAt.getTime() < CACHE_TTL_MS;
}
