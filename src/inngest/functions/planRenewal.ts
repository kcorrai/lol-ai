import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { generatePlan } from "@/domains/analysis/services/improvementPlanService";
import { getEmailClient, EMAIL_FROM } from "@/lib/email/client";
import { buildPlanRenewalEmail } from "@/lib/email/templates/planRenewal";
import { logger } from "@/lib/utils/logger";

interface PlanExpiredPayload {
  planId: string;
  riotAccountId: string;
  userId: string;
}

// Runs daily at 00:00 UTC. Finds all active plans that have passed their
// expiry date, marks them expired, and fires renewal events.
export const planExpiryChecker = inngest.createFunction(
  { id: "plan-expiry-checker", triggers: [{ cron: "0 0 * * *" }], retries: 1 },
  async () => {
    const expired = await prisma.improvementPlan.findMany({
      where: { status: "active", expiresAt: { lte: new Date() } },
      include: { riotAccount: { select: { userId: true } } },
    });

    if (expired.length === 0) return { expired: 0 };

    await prisma.improvementPlan.updateMany({
      where: { id: { in: expired.map((p) => p.id) } },
      data: { status: "expired" },
    });

    await inngest.send(
      expired.map((p) => ({
        name: "improvement/plan.expired" as const,
        data: { planId: p.id, riotAccountId: p.riotAccountId, userId: p.riotAccount.userId } satisfies PlanExpiredPayload,
      }))
    );

    logger.info(`[planExpiryChecker] Expired and queued renewal for ${expired.length} plans`);
    return { expired: expired.length };
  }
);

// Triggered by improvement/plan.expired. Generates a new plan and notifies the user.
export const planRenewalWorker = inngest.createFunction(
  {
    id: "plan-renewal-worker",
    triggers: [{ event: "improvement/plan.expired" }],
    concurrency: { limit: 5, key: "event.data.riotAccountId" },
    retries: 2,
  },
  async ({ event }) => {
    const { riotAccountId, userId } = event.data as PlanExpiredPayload;

    const newPlan = await generatePlan(riotAccountId);
    logger.info(`[planRenewalWorker] New plan generated`, { riotAccountId, planId: newPlan.id });

    // Notify user
    const [user, account] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailOptOut: true } }),
      prisma.riotAccount.findUnique({ where: { id: riotAccountId }, select: { gameName: true } }),
    ]);

    if (!user?.email || user.emailOptOut) return { planId: newPlan.id, notified: false };

    const emailClient = getEmailClient();
    if (!emailClient) return { planId: newPlan.id, notified: false };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
    const { subject, html } = buildPlanRenewalEmail({
      gameName: account?.gameName ?? "Player",
      appUrl,
    });

    const { error } = await emailClient.emails.send({ from: EMAIL_FROM, to: user.email, subject, html });
    if (error) logger.error(`[planRenewalWorker] Email send failed`, { userId, error });

    return { planId: newPlan.id, notified: !error };
  }
);
