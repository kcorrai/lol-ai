import { prismaReadonly } from "@/lib/db/prismaReadonly";
import { Errors } from "@/lib/api/errors";
import { logger } from "@/lib/utils/logger";
import * as repo from "@/domains/teams/repositories/teamRepository";
import type {
  TeamSummary,
  TeamMemberRow,
  TeamDashboardData,
  TeamMemberSummary,
  CreateTeamInput,
} from "@/domains/teams/types/teams.types";

const MAX_TEAMS_PER_USER = 5;

export async function assertTeamAccess(
  teamId: string,
  userId: string
): Promise<void> {
  const membership = await repo.findMembership(teamId, userId);
  if (!membership) throw Errors.forbidden("You are not a member of this team");
}

export async function assertCoachAccess(
  teamId: string,
  userId: string
): Promise<void> {
  const membership = await repo.findMembership(teamId, userId);
  if (!membership) throw Errors.forbidden("You are not a member of this team");
  if (membership.role !== "OWNER" && membership.role !== "COACH") {
    throw Errors.forbidden("Coach or Owner role required");
  }
}

export async function assertOwnerAccess(
  teamId: string,
  userId: string
): Promise<void> {
  const membership = await repo.findMembership(teamId, userId);
  if (!membership || membership.role !== "OWNER") {
    throw Errors.forbidden("Team owner access required");
  }
}

export async function assertTeamPlan(userId: string): Promise<void> {
  const sub = await prismaReadonly.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  });
  const active = sub?.status === "active" || sub?.status === "trialing";
  if (!active || sub?.plan !== "team") {
    throw Errors.forbidden("Team Plan subscription required for this feature");
  }
}

export async function createTeam(
  userId: string,
  input: CreateTeamInput
): Promise<{ id: string; name: string }> {
  await assertTeamPlan(userId);

  const existingMemberships = await repo.findTeamsByUserId(userId);
  const ownedCount = existingMemberships.filter((m) => m.role === "OWNER").length;
  if (ownedCount >= MAX_TEAMS_PER_USER) {
    throw Errors.conflict(`Maximum ${MAX_TEAMS_PER_USER} teams per user`);
  }

  const team = await repo.createTeamWithOwner(userId, input.name, input.logoUrl);
  logger.info("[teamService] team created", { teamId: team.id, ownerId: userId });
  return { id: team.id, name: team.name };
}

export async function updateTeam(
  teamId: string,
  userId: string,
  data: { name?: string; logoUrl?: string }
): Promise<void> {
  await assertOwnerAccess(teamId, userId);
  if (data.name !== undefined && data.name.trim().length < 2) {
    throw Errors.validation("Team name must be at least 2 characters");
  }
  await repo.updateTeam(teamId, { name: data.name?.trim(), logoUrl: data.logoUrl });
  logger.info("[teamService] team updated", { teamId, userId });
}

export async function deleteTeam(teamId: string, userId: string): Promise<void> {
  await assertOwnerAccess(teamId, userId);
  await repo.deleteTeam(teamId);
  logger.info("[teamService] team deleted", { teamId, userId });
}

export async function getMyTeams(userId: string): Promise<TeamSummary[]> {
  const memberships = await repo.findTeamsByUserId(userId);
  return memberships.map((m) => ({
    id: m.team.id,
    name: m.team.name,
    logoUrl: m.team.logoUrl,
    ownerId: m.team.ownerId,
    memberCount: m.team._count.members,
    myRole: m.role,
    createdAt: m.team.createdAt.toISOString(),
  }));
}

export async function getTeamMembers(
  teamId: string,
  userId: string
): Promise<TeamMemberRow[]> {
  await assertTeamAccess(teamId, userId);
  const team = await repo.findTeamById(teamId);
  if (!team) throw Errors.notFound("Team");

  return team.members.map((m) => ({
    id: m.id,
    userId: m.userId,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
    gameName: null,
    tagLine: null,
    email: m.user.email,
    avatarUrl: m.user.image,
  }));
}

export async function updateMemberRole(
  teamId: string,
  targetUserId: string,
  requestingUserId: string,
  newRole: "COACH" | "PLAYER"
): Promise<void> {
  await assertOwnerAccess(teamId, requestingUserId);

  const membership = await repo.findMembership(teamId, targetUserId);
  if (!membership) throw Errors.notFound("Team member");
  if (membership.role === "OWNER") throw Errors.forbidden("Cannot change owner role");

  await repo.updateMemberRole(teamId, targetUserId, newRole);
  logger.info("[teamService] member role updated", { teamId, targetUserId, newRole });
}

export async function removeMember(
  teamId: string,
  targetUserId: string,
  requestingUserId: string
): Promise<void> {
  await assertOwnerAccess(teamId, requestingUserId);

  if (targetUserId === requestingUserId) {
    throw Errors.conflict("Team owner cannot remove themselves");
  }

  const membership = await repo.findMembership(teamId, targetUserId);
  if (!membership) throw Errors.notFound("Team member");

  await repo.removeMember(teamId, targetUserId);
  logger.info("[teamService] member removed", { teamId, targetUserId, requestingUserId });
}

const RANGE_DAYS: Record<"7d" | "30d" | "90d", number> = { "7d": 7, "30d": 30, "90d": 90 };

export async function getTeamDashboard(
  teamId: string,
  userId: string,
  range: "7d" | "30d" | "90d" = "7d"
): Promise<TeamDashboardData> {
  await assertCoachAccess(teamId, userId);

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
        const sumKDA = recentStats.reduce((s, m) => s + (m.kills + m.assists) / Math.max(m.deaths, 1), 0);
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
  const avgWinRate7d = rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null;

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
