import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { getEmailClient, EMAIL_FROM } from "@/lib/email/client";
import { buildTeamInviteEmail } from "@/lib/email/templates/teamInvite";

interface TeamInvitePayload {
  teamId: string;
  teamName: string;
  inviterUserId: string;
  email: string;
  token: string;
  role: string;
}

export const teamInviteEmail = inngest.createFunction(
  {
    id: "team-invite-email",
    triggers: [{ event: "team/invite.send" }],
    retries: 2,
  },
  async ({ event }) => {
    const { teamName, inviterUserId, email, token } =
      event.data as TeamInvitePayload;

    const emailClient = getEmailClient();
    if (!emailClient) return { skipped: "no_email_client" };

    const inviter = await prisma.user.findUnique({
      where: { id: inviterUserId },
      select: { name: true, email: true },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
    const joinUrl = `${appUrl}/teams/join?token=${token}`;

    const { subject, html } = buildTeamInviteEmail({
      teamName,
      inviterName: inviter?.name ?? inviter?.email ?? "A coach",
      joinUrl,
      appUrl,
      expiresHours: 48,
    });

    const { error } = await emailClient.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject,
      html,
    });

    if (error) {
      logger.error("[teamInviteEmail] Resend error", { email, error });
      throw new Error(error.message);
    }

    logger.info("[teamInviteEmail] sent", { email, teamName });
    return { sent: true };
  }
);
