import { randomBytes } from "crypto";
import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { Errors } from "@/lib/api/errors";
import { logger } from "@/lib/utils/logger";
import * as repo from "@/domains/teams/repositories/teamRepository";
import { assertCoachAccess, assertTeamPlan } from "@/domains/teams/services/teamService";
import type { InviteMemberInput } from "@/domains/teams/types/teams.types";

const INVITE_TTL_HOURS = 48;
const MAX_MEMBERS = 5;

function generateToken(): string {
  return randomBytes(24).toString("hex");
}

export async function inviteMember(
  teamId: string,
  requestingUserId: string,
  input: InviteMemberInput
): Promise<{ token: string }> {
  await assertTeamPlan(requestingUserId);
  await assertCoachAccess(teamId, requestingUserId);

  const team = await repo.findTeamById(teamId);
  if (!team) throw Errors.notFound("Team");

  if (team.members.length >= MAX_MEMBERS) {
    throw Errors.conflict(`Team is at maximum capacity (${MAX_MEMBERS} members)`);
  }

  // Check if already a member
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existingUser) {
    const alreadyMember = await repo.findMembership(teamId, existingUser.id);
    if (alreadyMember) throw Errors.conflict("User is already a member of this team");
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);

  await repo.createInvite(teamId, input.email, token, input.role, expiresAt);

  // Fire invite email via Inngest (fire-and-forget)
  await inngest.send({
    name: "team/invite.send",
    data: {
      teamId,
      teamName: team.name,
      inviterUserId: requestingUserId,
      email: input.email,
      token,
      role: input.role,
    },
  });

  logger.info("[teamInviteService] invite sent", { teamId, email: input.email });
  return { token };
}

export async function acceptInvite(
  token: string,
  acceptingUserId: string
): Promise<{ teamId: string; teamName: string }> {
  const invite = await repo.findInviteByToken(token);

  if (!invite) throw Errors.notFound("Invite");
  if (invite.usedAt) throw Errors.conflict("Invite has already been used");
  if (invite.expiresAt < new Date()) throw Errors.conflict("Invite has expired");

  // Guard against duplicate membership
  const existing = await repo.findMembership(invite.teamId, acceptingUserId);
  if (existing) throw Errors.conflict("You are already a member of this team");

  await prisma.$transaction([
    prisma.teamMember.create({
      data: { teamId: invite.teamId, userId: acceptingUserId, role: invite.role },
    }),
    prisma.teamInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    }),
  ]);

  logger.info("[teamInviteService] invite accepted", {
    teamId: invite.teamId,
    userId: acceptingUserId,
  });

  return { teamId: invite.teamId, teamName: invite.team.name };
}
