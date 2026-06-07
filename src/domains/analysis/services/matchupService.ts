import { prisma } from "@/lib/db/prisma";
import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import type { Position } from "@prisma/client";

export interface MatchupCell {
  playerChampion: string;
  opponentChampion: string;
  wins: number;
  losses: number;
  winRate: number;
  avgKda: number;
  gamesPlayed: number;
}

export interface MatchupMatrix {
  playerChampions: string[];
  opponentChampions: string[];
  cells: MatchupCell[];
  generatedAt: string;
  position: string | null;
}

interface AggStats {
  wins: number;
  games: number;
  totalKda: number;
}

export async function buildMatchupMatrix(
  riotAccountId: string,
  position?: string
): Promise<MatchupMatrix> {
  const cacheKey = buildCacheKey("matchup-matrix", {
    riotAccountId,
    position: position ?? "all",
  });
  const cached = await getCached(cacheKey);
  if (cached) return cached as MatchupMatrix;

  const positionFilter = position ? ({ position: position as Position }) : {};

  const userParticipants = await prisma.matchParticipant.findMany({
    where: { riotAccountId, match: { queueType: "RANKED_SOLO_5x5" }, ...positionFilter },
    select: {
      matchId: true,
      teamId: true,
      position: true,
      championName: true,
      won: true,
      kills: true,
      deaths: true,
      assists: true,
    },
    orderBy: { match: { gameStart: "desc" } },
    take: 300,
  });

  if (userParticipants.length === 0) {
    return { playerChampions: [], opponentChampions: [], cells: [], generatedAt: new Date().toISOString(), position: position ?? null };
  }

  const matchIds = [...new Set(userParticipants.map((p) => p.matchId))];

  // Batch-fetch all other participants in those matches.
  // Prisma's NOT: { field: value } excludes NULLs in SQL, so we must use OR
  // explicitly to include opponents who have riotAccountId = null.
  const allOthers = await prisma.matchParticipant.findMany({
    where: {
      matchId: { in: matchIds },
      OR: [{ riotAccountId: null }, { riotAccountId: { not: riotAccountId } }],
    },
    select: { matchId: true, teamId: true, position: true, championName: true },
  });

  // Group opponents by matchId for O(1) lookup
  const byMatch = new Map<string, typeof allOthers>();
  for (const op of allOthers) {
    if (!byMatch.has(op.matchId)) byMatch.set(op.matchId, []);
    byMatch.get(op.matchId)!.push(op);
  }

  const stats = new Map<string, AggStats>();

  for (const up of userParticipants) {
    const others = byMatch.get(up.matchId) ?? [];
    const laneOp = others.find(
      (o) => o.position === up.position && o.teamId !== up.teamId
    );
    if (!laneOp) continue;

    const key = `${up.championName}|||${laneOp.championName}`;
    const s = stats.get(key) ?? { wins: 0, games: 0, totalKda: 0 };
    s.wins += up.won ? 1 : 0;
    s.games += 1;
    s.totalKda += (up.kills + up.assists) / Math.max(up.deaths, 1);
    stats.set(key, s);
  }

  // Build cells (only show cells with ≥ 1 game so matrix isn't sparse)
  const cells: MatchupCell[] = [];
  for (const [key, s] of stats) {
    const [playerChampion, opponentChampion] = key.split("|||");
    cells.push({
      playerChampion,
      opponentChampion,
      wins: s.wins,
      losses: s.games - s.wins,
      winRate: Math.round((s.wins / s.games) * 100),
      avgKda: Math.round((s.totalKda / s.games) * 100) / 100,
      gamesPlayed: s.games,
    });
  }

  // Limit display: top 8 player champs by total games, top 12 opponent champs by frequency
  const playerGames = new Map<string, number>();
  const opponentFreq = new Map<string, number>();
  for (const c of cells) {
    playerGames.set(c.playerChampion, (playerGames.get(c.playerChampion) ?? 0) + c.gamesPlayed);
    opponentFreq.set(c.opponentChampion, (opponentFreq.get(c.opponentChampion) ?? 0) + c.gamesPlayed);
  }
  const topPlayers = [...playerGames.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k);
  const topOpponents = [...opponentFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k]) => k);

  const filteredCells = cells.filter(
    (c) => topPlayers.includes(c.playerChampion) && topOpponents.includes(c.opponentChampion)
  );

  const result: MatchupMatrix = {
    playerChampions: topPlayers,
    opponentChampions: topOpponents,
    cells: filteredCells,
    generatedAt: new Date().toISOString(),
    position: position ?? null,
  };

  await setCached(cacheKey, "matchup-matrix", result, 0.25); // 6 hours
  return result;
}
