import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { getEmailClient, EMAIL_FROM } from "@/lib/email/client";
import { buildActivationEmail } from "@/lib/email/templates/activation";

export interface RiotAccountConnectedPayload {
  userId: string;
  gameName: string;
}

export const sendActivationEmail = inngest.createFunction(
  {
    id: "send-activation-email",
    triggers: [{ event: "riot/account.connected" }],
    retries: 2,
  },
  async ({ event }) => {
    const { userId, gameName } = event.data as RiotAccountConnectedPayload;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerified: true, emailOptOut: true },
    });
    if (!user?.email) return { skipped: "no_email" };
    if (user.emailOptOut) return { skipped: "opted_out" };

    const emailClient = getEmailClient();
    if (!emailClient) return { skipped: "no_email_client" };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
    const { subject, html } = buildActivationEmail({ gameName, appUrl });

    const { error } = await emailClient.emails.send({
      from: EMAIL_FROM,
      to: user.email,
      subject,
      html,
    });

    if (error) {
      logger.error("[sendActivationEmail] Resend error", { userId, error });
      throw new Error(error.message);
    }

    logger.info("[sendActivationEmail] Sent", { userId, gameName });
    return { sent: true };
  }
);
