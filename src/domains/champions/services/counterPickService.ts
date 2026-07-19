import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";

export interface CounterEntry {
  championName: string;
  games: number;
  wins: number;
  winRate: number;
}

export interface CounterStats {
  champion: string;
  nemeses: CounterEntry[];  // enemies you lose to most
  prey: CounterEntry[];     // enemies you beat most
  totalGames: number;
}

const MIN_GAMES = 3;

export async function getCounterStats(
  riotAccountId: string,
  champion: string
): Promise<CounterStats | null> {
  const puuid = await getAccountPuuid(riotAccountId);
  // Find all ranked matches where the user played this champion
  const userParticipations = await prisma.matchParticipant.findMany({
    where: {
      puuid: puuid ?? "",
      championName: champion,
      match: { queueType: "RANKED_SOLO_5x5" },
    },
    select: {
      matchId: true,
      teamId: true,
      won: true,
    },
  });

  if (userParticipations.length === 0) return null;

  // For each match, get enemy participants (opposite teamId)
  const matchIds = userParticipations.map((p) => p.matchId);
  const winByMatch = new Map(userParticipations.map((p) => [p.matchId, p.won]));
  const teamByMatch = new Map(userParticipations.map((p) => [p.matchId, p.teamId]));

  const allParticipants = await prisma.matchParticipant.findMany({
    where: {
      matchId: { in: matchIds },
      riotAccountId: null, // exclude our own records (already linked)
      puuid: { not: "" },
    },
    select: {
      matchId: true,
      teamId: true,
      championName: true,
    },
  });

  // Group by enemy champion
  const stats = new Map<string, { wins: number; games: number }>();

  for (const p of allParticipants) {
    const userTeam = teamByMatch.get(p.matchId);
    if (userTeam === undefined) continue;
    if (p.teamId === userTeam) continue; // same team, skip

    const userWon = winByMatch.get(p.matchId) ?? false;
    const existing = stats.get(p.championName) ?? { wins: 0, games: 0 };
    stats.set(p.championName, {
      games: existing.games + 1,
      wins: existing.wins + (userWon ? 1 : 0),
    });
  }

  const entries: CounterEntry[] = [...stats.entries()]
    .filter(([, s]) => s.games >= MIN_GAMES)
    .map(([name, s]) => ({
      championName: name,
      games: s.games,
      wins: s.wins,
      winRate: Math.round((s.wins / s.games) * 100),
    }));

  // Nemeses: lowest win rate (you lose to them most)
  const nemeses = [...entries]
    .sort((a, b) => a.winRate - b.winRate || b.games - a.games)
    .slice(0, 3);

  // Prey: highest win rate (you beat them most)
  const prey = [...entries]
    .sort((a, b) => b.winRate - a.winRate || b.games - a.games)
    .slice(0, 3);

  return {
    champion,
    nemeses,
    prey,
    totalGames: userParticipations.length,
  };
}
