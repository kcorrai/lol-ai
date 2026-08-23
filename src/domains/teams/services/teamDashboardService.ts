import { prismaReadonly } from "@/lib/db/prismaReadonly";
import { Errors } from "@/lib/api/errors";
import * as repo from "@/domains/teams/repositories/teamRepository";
import { assertMemberAccess } from "@/domains/teams/services/teamService";
import type { TeamDashboardData, TeamMemberSummary } from "@/domains/teams/types/teams.types";

const RANGE_DAYS: Record<"7d" | "30d" | "90d", number> = { "7d": 7, "30d": 30, "90d": 90 };

export async function getTeamDashboard(
  teamId: string,
  userId: string,
  range: "7d" | "30d" | "90d" = "7d"
): Promise<TeamDashboardData> {
  await assertMemberAccess(teamId, userId);

  const team = await repo.findTeamById(teamId);
  if (!team) throw Errors.notFound("Team");

  const memberIds = team.members.map((m) => m.userId);

  // Fetch riot accounts, last match, last report for each member in parallel
  const memberDataList = await Promise.all(
    memberIds.map(async (memberId): Promise<TeamMemberSummary> => {
      const teamMember = team.members.find((m) => m.userId === memberId)!;

      const riotAccount = await prismaReadonly.riotAccount.findFirst({
        where: { userId: memberId, isPrimary: true },
        select: {
          id: true,
          gameName: true,
          tagLine: true,
          rankedHistory: {
            where: { queueType: "RANKED_SOLO_5x5" },
            orderBy: { recordedAt: "desc" },
            take: 1,
            select: { tier: true, division: true, lp: true },
          },
          championStats: {
            where: { queueType: "RANKED_SOLO_5x5" },
            orderBy: { gamesPlayed: "desc" },
            take: 1,
            include: { champion: { select: { name: true } } },
          },
          matchParticipants: {
            orderBy: { match: { gameStart: "desc" } },
            take: 1,
            select: { won: true, championName: true },
          },
          coachingReports: {
            where: { status: "complete" },
            orderBy: { completedAt: "desc" },
            take: 1,
            select: { id: true },
          },
        },
      });

      if (!riotAccount) {
        return {
          userId: memberId,
          memberId: teamMember.id,
          role: teamMember.role,
          gameName: teamMember.user?.name ?? "Unknown",
          tagLine: "",
          profileSlug: teamMember.user?.profileSlug ?? null,
          rank: null,
          topChampion: null,
          lastMatchResult: null,
          lastMatchChampion: null,
          lastReportId: null,
          lastReportScore: null,
          winRate7d: null,
          avgKDA7d: null,
          avgCSPerMinute7d: null,
          avgVisionScore7d: null,
        };
      }

      const ranked = riotAccount.rankedHistory[0];
      const rank = ranked ? { tier: ranked.tier, division: ranked.division, lp: ranked.lp } : null;
      const lastMatch = riotAccount.matchParticipants[0];
      const lastReport = riotAccount.coachingReports[0];
      const topChampion = riotAccount.championStats[0]?.champion.name ?? null;

      // Win rate for selected range
      const since7d = new Date(Date.now() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000);
      const recentMatches = await prismaReadonly.matchParticipant.findMany({
        where: {
          riotAccountId: riotAccount.id,
          match: { gameStart: { gte: since7d } },
        },
        select: { won: true },
      });
      const winRate7d =
        recentMatches.length > 0
          ? Math.round((recentMatches.filter((m) => m.won).length / recentMatches.length) * 100)
          : null;

      // Comparison stats (KDA, CS/min, vision) for selected range
      const recentStats = await prismaReadonly.matchParticipant.findMany({
        where: {
          riotAccountId: riotAccount.id,
          match: { gameStart: { gte: since7d } },
        },
        select: { kills: true, deaths: true, assists: true, csPerMinute: true, visionScore: true },
      });

      let avgKDA7d: number | null = null;
      let avgCSPerMinute7d: number | null = null;
      let avgVisionScore7d: number | null = null;
      if (recentStats.length > 0) {
        const n = recentStats.length;
        const sumKDA = recentStats.reduce(
          (s, m) => s + (m.kills + m.assists) / Math.max(m.deaths, 1),
          0
        );
        const sumCS = recentStats.reduce((s, m) => s + Number(m.csPerMinute), 0);
        const sumVision = recentStats.reduce((s, m) => s + m.visionScore, 0);
        avgKDA7d = parseFloat((sumKDA / n).toFixed(2));
        avgCSPerMinute7d = parseFloat((sumCS / n).toFixed(2));
        avgVisionScore7d = parseFloat((sumVision / n).toFixed(1));
      }

      return {
        userId: memberId,
        memberId: teamMember.id,
        role: teamMember.role,
        gameName: riotAccount.gameName,
        tagLine: riotAccount.tagLine,
        profileSlug: teamMember.user?.profileSlug ?? null,
        rank,
        topChampion,
        lastMatchResult: lastMatch ? (lastMatch.won ? "WIN" : "LOSS") : null,
        lastMatchChampion: lastMatch?.championName ?? null,
        lastReportId: lastReport?.id ?? null,
        lastReportScore: null,
        winRate7d,
        avgKDA7d,
        avgCSPerMinute7d,
        avgVisionScore7d,
      };
    })
  );

  const rates = memberDataList.map((m) => m.winRate7d).filter((r): r is number => r !== null);
  const avgWinRate7d =
    rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null;

  return {
    team: {
      id: team.id,
      name: team.name,
      logoUrl: team.logoUrl,
      memberCount: memberDataList.length,
      maxMembers: 5,
      avgWinRate7d,
    },
    members: memberDataList,
  };
}
