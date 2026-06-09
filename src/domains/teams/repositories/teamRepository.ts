import { prisma } from "@/lib/db/prisma";
import type { TeamRole } from "@prisma/client";

export async function findTeamById(id: string) {
  return prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { id: true, email: true, name: true, image: true } },
        },
      },
    },
  });
}

export async function findTeamsByUserId(userId: string) {
  return prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        include: { _count: { select: { members: true } } },
      },
    },
    orderBy: { joinedAt: "desc" },
  });
}

export async function createTeamWithOwner(ownerId: string, name: string, logoUrl?: string) {
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: { name, logoUrl, ownerId },
    });
    await tx.teamMember.create({
      data: { teamId: team.id, userId: ownerId, role: "OWNER" },
    });
    return team;
  });
}

export async function updateTeam(teamId: string, data: { name?: string; logoUrl?: string }) {
  return prisma.team.update({ where: { id: teamId }, data });
}

export async function deleteTeam(teamId: string) {
  return prisma.team.delete({ where: { id: teamId } });
}

export async function findMembership(teamId: string, userId: string) {
  return prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
}

export async function addMember(teamId: string, userId: string, role: TeamRole) {
  return prisma.teamMember.create({
    data: { teamId, userId, role },
  });
}

export async function removeMember(teamId: string, userId: string) {
  return prisma.teamMember.delete({
    where: { teamId_userId: { teamId, userId } },
  });
}

export async function updateMemberRole(teamId: string, userId: string, role: TeamRole) {
  return prisma.teamMember.update({
    where: { teamId_userId: { teamId, userId } },
    data: { role },
  });
}

export async function createInvite(
  teamId: string,
  email: string,
  token: string,
  role: TeamRole,
  expiresAt: Date
) {
  return prisma.teamInvite.create({
    data: { teamId, email, token, role, expiresAt },
  });
}

export async function findInviteByToken(token: string) {
  return prisma.teamInvite.findUnique({
    where: { token },
    include: { team: true },
  });
}

export async function markInviteUsed(inviteId: string) {
  return prisma.teamInvite.update({
    where: { id: inviteId },
    data: { usedAt: new Date() },
  });
}

export async function findPendingInvites(teamId: string) {
  return prisma.teamInvite.findMany({
    where: { teamId, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
  });
}

export async function deleteInvite(inviteId: string, teamId: string) {
  return prisma.teamInvite.deleteMany({
    where: { id: inviteId, teamId },
  });
}
