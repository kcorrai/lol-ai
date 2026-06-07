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
