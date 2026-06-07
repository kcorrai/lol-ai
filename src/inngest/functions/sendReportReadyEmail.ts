import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { getEmailClient, EMAIL_FROM } from "@/lib/email/client";
import { buildReportReadyEmail } from "@/lib/email/templates/reportReady";

export interface ReportCompletedPayload {
  reportId: string;
  riotAccountId: string;
  reportType: string;
}

export const sendReportReadyEmail = inngest.createFunction(
  {
    id: "send-report-ready-email",
    triggers: [{ event: "report/completed" }],
    retries: 2,
  },
  async ({ event }) => {
    const { reportId, riotAccountId, reportType } = event.data as ReportCompletedPayload;

    const account = await prisma.riotAccount.findUnique({
      where: { id: riotAccountId },
      select: {
        gameName: true,
        user: { select: { email: true } },
      },
    });
    if (!account?.user?.email) return { skipped: "no_email" };

    const emailClient = getEmailClient();
    if (!emailClient) return { skipped: "no_email_client" };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
    const { subject, html } = buildReportReadyEmail({
      gameName: account.gameName,
      reportType,
      reportId,
      appUrl,
    });

    const { error } = await emailClient.emails.send({
      from: EMAIL_FROM,
      to: account.user.email,
      subject,
      html,
    });

    if (error) {
      logger.error("[sendReportReadyEmail] Resend error", { reportId, error });
      throw new Error(error.message);
    }

    logger.info("[sendReportReadyEmail] Sent", { reportId, gameName: account.gameName });
    return { sent: true };
  }
);
