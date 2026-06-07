import { prisma } from "@/lib/db/prisma";
import { getEmailClient, EMAIL_FROM } from "@/lib/email/client";
import { logger } from "@/lib/utils/logger";
import { buildWeeklyStats, renderWeeklyEmail, getIsoWeekKey } from "./weeklyEmailRenderer";

export { escapeHtml, getIsoWeekKey, lpComposite } from "./weeklyEmailRenderer";

export async function sendWeeklyReports(): Promise<{
  sent: number;
  skipped: number;
  errors: number;
}> {
  const emailClient = getEmailClient();
  if (!emailClient) {
    logger.warn("[weekly-report] RESEND_API_KEY not set — skipping email send");
    return { sent: 0, skipped: 0, errors: 0 };
  }

  const now = new Date();
  const weekKey = getIsoWeekKey(now);

  // Single batch query: includes subscription status and preferred riot account to avoid
  // N+1 DB calls for data that doesn't change during the batch run.
  const users = await prisma.user.findMany({
    where: {
      email: { not: null },
      riotAccounts: { some: {} },
    },
    select: {
      id: true,
      email: true,
      subscription: { select: { plan: true, status: true } },
      profile: { select: { emailWeeklyReport: true } },
      riotAccounts: {
        orderBy: { isPrimary: "desc" },
        select: { id: true, gameName: true },
        take: 1,
      },
    },
  });

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of users) {
    if (!user.email) { skipped++; continue; }

    const account = user.riotAccounts[0];
    if (!account) { skipped++; continue; }

    // Respect unsubscribe preference — users without a profile row are treated as opted in
    if (user.profile?.emailWeeklyReport === false) { skipped++; continue; }

    // Idempotency: skip users already emailed this ISO week.
    // Reuses the WebhookEvent table (same pattern as LemonSqueezy webhook dedup).
    const idempotencyKey = `weekly-email:${user.id}:${weekKey}`;
    const alreadySent = await prisma.webhookEvent.findUnique({
      where: { eventKey: idempotencyKey },
    });
    if (alreadySent) { skipped++; continue; }

    const isPro =
      (user.subscription?.plan === "pro" || user.subscription?.plan === "elite") &&
      (user.subscription?.status === "active" || user.subscription?.status === "trialing");

    try {
      const stats = await buildWeeklyStats(account.id, account.gameName, isPro, now);
      if (!stats) { skipped++; continue; }

      const { subject, html } = renderWeeklyEmail(stats);

      await emailClient.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject,
        html,
      });

      // Record the send — silently swallow unique-constraint errors from rare concurrent runs
      await prisma.webhookEvent.create({ data: { eventKey: idempotencyKey } }).catch(() => {});

      sent++;
    } catch (err) {
      logger.error("[weekly-report] Failed for user", { userId: user.id, err });
      errors++;
    }
  }

  logger.info("[weekly-report] batch complete", { sent, skipped, errors, weekKey });
  return { sent, skipped, errors };
}
