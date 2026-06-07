import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { getEmailClient, EMAIL_FROM } from "@/lib/email/client";
import { buildReengagementEmail, type NudgeType } from "@/lib/email/templates/reengagement";
import { computeRetentionSignals } from "@/domains/analysis/services/retentionService";
import { logger } from "@/lib/utils/logger";

const INACTIVE_MIN_DAYS = 7;
const INACTIVE_MAX_DAYS = 14;
const IDEMPOTENCY_PREFIX = "reengagement";

// Fires every day at 10:00 UTC.
// Targets users whose primary Riot account hasn't synced in 7–14 days.
// Using sync time as an activity proxy avoids a schema migration while
// being a reliable signal — users who log in always trigger a sync.
export const sendReengagementEmails = inngest.createFunction(
  {
    id: "send-reengagement-emails",
    triggers: [{ cron: "0 10 * * *" }],
    retries: 2,
  },
  async () => {
    const emailClient = getEmailClient();
    if (!emailClient) {
      logger.warn("[reengagement] RESEND_API_KEY not set — skipping");
      return { sent: 0, skipped: 0, errors: 0 };
    }

    const now = new Date();
    const minThreshold = new Date(now.getTime() - INACTIVE_MAX_DAYS * 24 * 60 * 60 * 1000);
    const maxThreshold = new Date(now.getTime() - INACTIVE_MIN_DAYS * 24 * 60 * 60 * 1000);

    // ISO week key for idempotency — one email per user per week
    const weekKey = getIsoWeekKey(now);

    const users = await prisma.user.findMany({
      where: {
        email: { not: null },
        profile: { emailWeeklyReport: { not: false } },
        riotAccounts: {
          some: {
            isPrimary: true,
            updatedAt: { gte: minThreshold, lte: maxThreshold },
          },
        },
      },
      select: {
        id: true,
        email: true,
        emailOptOut: true,
        profile: { select: { emailWeeklyReport: true } },
        riotAccounts: {
          where: { isPrimary: true },
          select: { id: true, gameName: true },
          take: 1,
        },
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://lolaicoach.gg";
    let sent = 0, skipped = 0, errors = 0;

    for (const user of users) {
      if (!user.email || user.emailOptOut) { skipped++; continue; }
      const account = user.riotAccounts[0];
      if (!account) { skipped++; continue; }

      const idempotencyKey = `${IDEMPOTENCY_PREFIX}:${user.id}:${weekKey}`;
      const alreadySent = await prisma.webhookEvent.findUnique({ where: { eventKey: idempotencyKey } });
      if (alreadySent) { skipped++; continue; }

      try {
        const signals = await computeRetentionSignals(account.id);
        const nudge = (signals.primaryNudge as NudgeType | null) ?? "generic";

        const { subject, html } = buildReengagementEmail({
          gameName: account.gameName,
          nudge,
          lossStreak: signals.lossStreak > 0 ? signals.lossStreak : undefined,
          appUrl,
        });

        await emailClient.emails.send({ from: EMAIL_FROM, to: user.email, subject, html });
        // Swallow unique-constraint errors from concurrent Inngest retries.
        await prisma.webhookEvent.create({ data: { eventKey: idempotencyKey } }).catch(() => {});

        sent++;
        logger.info("[reengagement] sent", { userId: user.id, nudge });
      } catch (err) {
        logger.error("[reengagement] failed for user", { userId: user.id, err });
        errors++;
      }
    }

    logger.info("[reengagement] batch complete", { sent, skipped, errors, weekKey });
    return { sent, skipped, errors };
  }
);

function getIsoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
