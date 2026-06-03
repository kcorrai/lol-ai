import { prisma } from "@/lib/db/prisma";
import { Errors } from "@/lib/api/errors";
import type { QueueType } from "@prisma/client";

export type ChampionPoolEntry = {
  championId: number;
  championName: string;
  imageUrl: string;
  gamesPlayed: number;
  wins: number;
  winRate: number;       // 0–100, rounded
  avgKda: number;        // rounded to 1 decimal
  avgCsPerMinute: number; // rounded to 1 decimal
  isBest: boolean;
};

interface AggregatedStat {
  name: string;
  games: number;
  wins: number;
  kdaSum: number;
  csSum: number;
}

export async function getChampionPool(
  riotAccountId: string,
  minGames = 3,
  queueType: QueueType = "RANKED_SOLO_5x5"
): Promise<ChampionPoolEntry[]> {
  const account = await prisma.riotAccount.findUnique({
    where: { id: riotAccountId },
    select: { id: true },
  });
  if (!account) throw Errors.notFound("Riot account");

  const participants = await prisma.matchParticipant.findMany({
    where: {
      riotAccountId,
      match: { queueType },
    },
    select: {
      championId: true,
      championName: true,
      kills: true,
      deaths: true,
      assists: true,
      csPerMinute: true,
      won: true,
    },
  });

  // Aggregate by championId in memory
  const statMap = new Map<number, AggregatedStat>();

  for (const p of participants) {
    const kda = (p.kills + p.assists) / Math.max(p.deaths, 1);
    const entry = statMap.get(p.championId);

    if (!entry) {
      statMap.set(p.championId, {
        name: p.championName,
        games: 1,
        wins: p.won ? 1 : 0,
        kdaSum: kda,
        csSum: Number(p.csPerMinute),
      });
    } else {
      entry.games++;
      entry.wins += p.won ? 1 : 0;
      entry.kdaSum += kda;
      entry.csSum += Number(p.csPerMinute);
    }
  }

  const eligibleIds = Array.from(statMap.entries())
    .filter(([, s]) => s.games >= minGames)
    .map(([id]) => id);

  if (eligibleIds.length === 0) return [];

  const champions = await prisma.champion.findMany({
    where: { id: { in: eligibleIds } },
    select: { id: true, imageUrl: true },
  });
  const imageMap = new Map(champions.map((c) => [c.id, c.imageUrl]));

  const entries = eligibleIds.map((cid): Omit<ChampionPoolEntry, "isBest"> => {
    const s = statMap.get(cid)!;
    return {
      championId: cid,
      championName: s.name,
      imageUrl: imageMap.get(cid) ?? "",
      gamesPlayed: s.games,
      wins: s.wins,
      winRate: Math.round((s.wins / s.games) * 100),
      avgKda: Math.round((s.kdaSum / s.games) * 10) / 10,
      avgCsPerMinute: Math.round((s.csSum / s.games) * 10) / 10,
    };
  });

  entries.sort((a, b) => b.winRate - a.winRate || b.gamesPlayed - a.gamesPlayed);

  // Best champion: highest win rate with ≥ 5 games; fall back to top entry
  const bestCandidate = entries.find((e) => e.gamesPlayed >= 5) ?? entries[0];

  return entries.map((e) => ({
    ...e,
    isBest: bestCandidate ? e.championId === bestCandidate.championId : false,
  }));
}
