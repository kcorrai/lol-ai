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
const MAX_MEMBERS_PER_TEAM = 20;

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

export async function getTeamDashboard(
  teamId: string,
  userId: string
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
            orderBy: { recordedAt: "desc" },
            take: 1,
            select: { tier: true, division: true, lp: true },
          },
          matchParticipants: {
            orderBy: {
              match: { gameStart: "desc" },
            },
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
          lastMatchResult: null,
          lastMatchChampion: null,
          lastReportId: null,
          lastReportScore: null,
          winRate7d: null,
        };
      }

      const ranked = riotAccount.rankedHistory[0];
      const rank = ranked ? `${ranked.tier} ${ranked.division} ${ranked.lp}LP` : null;
      const lastMatch = riotAccount.matchParticipants[0];
      const lastReport = riotAccount.coachingReports[0];

      // 7-day win rate
      const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
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

      return {
        userId: memberId,
        memberId: teamMember.id,
        role: teamMember.role,
        gameName: riotAccount.gameName,
        tagLine: riotAccount.tagLine,
        rank,
        lastMatchResult: lastMatch ? (lastMatch.won ? "WIN" : "LOSS") : null,
        lastMatchChampion: lastMatch?.championName ?? null,
        lastReportId: lastReport?.id ?? null,
        lastReportScore: null,
        winRate7d,
      };
    })
  );

  return {
    team: { id: team.id, name: team.name, logoUrl: team.logoUrl },
    members: memberDataList,
  };
}
