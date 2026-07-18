import crypto from "crypto";
import { prismaReadonly } from "@/lib/db/prismaReadonly";
import { Errors } from "@/lib/api/errors";
import { logger } from "@/lib/utils/logger";
import * as repo from "@/domains/teams/repositories/teamRepository";
import type {
  TeamSummary,
  TeamMemberRow,
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

export async function assertMemberAccess(
  teamId: string,
  userId: string
): Promise<void> {
  const membership = await repo.findMembership(teamId, userId);
  if (!membership) throw Errors.forbidden("You are not a member of this team");
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

  const [actor, target] = await Promise.all([
    prismaReadonly.user.findUnique({ where: { id: requestingUserId }, select: { name: true, email: true } }),
    prismaReadonly.user.findUnique({ where: { id: targetUserId }, select: { name: true, email: true } }),
  ]);
  const actorName = actor?.name ?? actor?.email ?? "Unknown";
  const targetName = target?.name ?? target?.email ?? "Unknown";

  await repo.removeMember(teamId, targetUserId);
  void repo.createTeamActivity(teamId, actorName, "member_removed", targetName);
  logger.info("[teamService] member removed", { teamId, targetUserId, requestingUserId });
}

export async function getOrCreateInviteLink(
  teamId: string,
  userId: string
): Promise<{ token: string; expiresAt: string }> {
  await assertCoachAccess(teamId, userId);

  const existing = await repo.findActiveLinkInvite(teamId);
  if (existing) return { token: existing.token, expiresAt: existing.expiresAt.toISOString() };

  const token = crypto.randomBytes(20).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const invite = await repo.createLinkInvite(teamId, token, expiresAt);
  return { token: invite.token, expiresAt: invite.expiresAt.toISOString() };
}

export async function revokeInviteLink(teamId: string, userId: string): Promise<void> {
  await assertOwnerAccess(teamId, userId);
  await repo.revokeLinkInvites(teamId);
  logger.info("[teamService] invite link revoked", { teamId, userId });
}

export interface TeamActivityItem {
  id: string;
  actorName: string;
  action: string;
  detail: string | null;
  createdAt: string;
}

export async function getTeamActivityFeed(teamId: string, userId: string): Promise<TeamActivityItem[]> {
  await assertTeamAccess(teamId, userId);
  const rows = await repo.getTeamActivities(teamId, 30);
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export async function acceptLinkInvite(token: string, userId: string): Promise<{ teamId: string }> {
  const invite = await repo.findInviteByToken(token);
  if (!invite || !invite.isLink) throw Errors.notFound("Invite");
  if (invite.usedAt) throw Errors.conflict("Invite link has already been used");
  if (invite.expiresAt < new Date()) throw Errors.conflict("Invite link has expired");

  const existing = await repo.findMembership(invite.teamId, userId);
  if (existing) return { teamId: invite.teamId };

  await repo.addMember(invite.teamId, userId, "PLAYER");
  const newMember = await prismaReadonly.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  const memberName = newMember?.name ?? newMember?.email ?? "Unknown";
  void repo.createTeamActivity(invite.teamId, memberName, "member_joined", "davet linki ile");
  logger.info("[teamService] link invite accepted", { teamId: invite.teamId, userId });
  return { teamId: invite.teamId };
}
