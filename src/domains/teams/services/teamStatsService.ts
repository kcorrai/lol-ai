import { prismaReadonly } from "@/lib/db/prismaReadonly";
import { assertCoachAccess } from "@/domains/teams/services/teamService";
import * as repo from "@/domains/teams/repositories/teamRepository";
import { Errors } from "@/lib/api/errors";

export interface DailyWinRate {
  date: string; // YYYY-MM-DD
  winRate: number;
  games: number;
}

export interface MemberTrend {
  gameName: string;
  tagLine: string;
  points: DailyWinRate[];
}

export interface TeamStatsData {
  range: "7d" | "30d" | "90d";
  teamWinRateTrend: DailyWinRate[];
  memberTrends: MemberTrend[];
  totalGames: number;
  avgWinRate: number | null;
}

const RANGE_DAYS: Record<"7d" | "30d" | "90d", number> = { "7d": 7, "30d": 30, "90d": 90 };

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getTeamStats(
  teamId: string,
  range: "7d" | "30d" | "90d"
): Promise<TeamStatsData> {
  const days = RANGE_DAYS[range];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const team = await repo.findTeamById(teamId);
  if (!team) throw Errors.notFound("Team");

  const memberIds = team.members.map((m) => m.userId);

  // Fetch all riot accounts for team members
  const accounts = await prismaReadonly.riotAccount.findMany({
    where: { userId: { in: memberIds }, isPrimary: true },
    select: { id: true, gameName: true, tagLine: true, userId: true },
  });

  // Fetch all match participants for these accounts in the date range
  const allParticipants = await prismaReadonly.matchParticipant.findMany({
    where: {
      riotAccountId: { in: accounts.map((a) => a.id) },
      match: { gameStart: { gte: since } },
    },
    select: {
      riotAccountId: true,
      won: true,
      match: { select: { gameStart: true } },
    },
    orderBy: { match: { gameStart: "asc" } },
  });

  // Build daily aggregate for team (any member played that day)
  const dailyMap = new Map<string, { wins: number; games: number }>();
  for (const p of allParticipants) {
    const day = toDateStr(p.match.gameStart);
    const entry = dailyMap.get(day) ?? { wins: 0, games: 0 };
    entry.games++;
    if (p.won) entry.wins++;
    dailyMap.set(day, entry);
  }

  const teamWinRateTrend: DailyWinRate[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { wins, games }]) => ({
      date,
      winRate: Math.round((wins / games) * 100),
      games,
    }));

  // Per-member trends
  const memberTrends: MemberTrend[] = accounts.map((acc) => {
    const accParticipants = allParticipants.filter((p) => p.riotAccountId === acc.id);
    const memberDailyMap = new Map<string, { wins: number; games: number }>();
    for (const p of accParticipants) {
      const day = toDateStr(p.match.gameStart);
      const entry = memberDailyMap.get(day) ?? { wins: 0, games: 0 };
      entry.games++;
      if (p.won) entry.wins++;
      memberDailyMap.set(day, entry);
    }
    const points: DailyWinRate[] = Array.from(memberDailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { wins, games }]) => ({
        date,
        winRate: Math.round((wins / games) * 100),
        games,
      }));
    return { gameName: acc.gameName, tagLine: acc.tagLine, points };
  });

  const totalGames = allParticipants.length;
  const totalWins = allParticipants.filter((p) => p.won).length;
  const avgWinRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : null;

  return { range, teamWinRateTrend, memberTrends, totalGames, avgWinRate };
}
