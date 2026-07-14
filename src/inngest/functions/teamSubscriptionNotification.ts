import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { getEmailClient, EMAIL_FROM } from "@/lib/email/client";
import {
  buildTeamSubscriptionCancelledEmail,
  buildTeamSubscriptionExpiredEmail,
} from "@/lib/email/templates/teamSubscriptionNotification";

interface TeamSubscriptionPayload {
  userId: string;
  periodEndDate?: string;
}

export const teamSubscriptionCancelledNotification = inngest.createFunction(
  {
    id: "team-subscription-cancelled-notification",
    triggers: [{ event: "team/subscription.cancelled" }],
    retries: 2,
  },
  async ({ event }) => {
    const { userId, periodEndDate } = event.data as TeamSubscriptionPayload;

    const emailClient = getEmailClient();
    if (!emailClient) return { skipped: "no_email_client" };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user?.email) {
      logger.warn("[teamSubscriptionCancelledNotification] user not found or no email", { userId });
      return { skipped: "no_user_email" };
    }

    const ownedTeams = await prisma.team.findMany({
      where: { ownerId: userId },
      select: { name: true },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
    const { subject, html } = buildTeamSubscriptionCancelledEmail({
      ownerName: user.name ?? user.email,
      teams: ownedTeams.map((t) => t.name),
      periodEndDate: periodEndDate
        ? new Date(periodEndDate).toLocaleDateString("en-US")
        : "period end",
      appUrl,
    });

    const { error } = await emailClient.emails.send({
      from: EMAIL_FROM,
      to: user.email,
      subject,
      html,
    });

    if (error) {
      logger.error("[teamSubscriptionCancelledNotification] Resend error", { userId, error });
      throw new Error(error.message);
    }

    logger.info("[teamSubscriptionCancelledNotification] sent", { userId });
    return { sent: true };
  }
);

export const teamSubscriptionExpiredNotification = inngest.createFunction(
  {
    id: "team-subscription-expired-notification",
    triggers: [{ event: "team/subscription.expired" }],
    retries: 2,
  },
  async ({ event }) => {
    const { userId } = event.data as TeamSubscriptionPayload;

    const emailClient = getEmailClient();
    if (!emailClient) return { skipped: "no_email_client" };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user?.email) {
      logger.warn("[teamSubscriptionExpiredNotification] user not found or no email", { userId });
      return { skipped: "no_user_email" };
    }

    const ownedTeams = await prisma.team.findMany({
      where: { ownerId: userId },
      select: { name: true },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
    const { subject, html } = buildTeamSubscriptionExpiredEmail({
      ownerName: user.name ?? user.email,
      teams: ownedTeams.map((t) => t.name),
      appUrl,
    });

    const { error } = await emailClient.emails.send({
      from: EMAIL_FROM,
      to: user.email,
      subject,
      html,
    });

    if (error) {
      logger.error("[teamSubscriptionExpiredNotification] Resend error", { userId, error });
      throw new Error(error.message);
    }

    logger.info("[teamSubscriptionExpiredNotification] sent", { userId });
    return { sent: true };
  }
);
