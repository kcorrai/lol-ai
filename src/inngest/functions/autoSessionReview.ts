import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { getPlanLimits } from "@/lib/auth/authorization";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";
import { createPendingReport } from "@/domains/coaching/services/reportService";

const MIN_MATCHES = 3;
const DEDUP_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours

export const autoSessionReview = inngest.createFunction(
  {
    id: "auto-session-review",
    triggers: [{ event: "match/session.synced" }],
    concurrency: { limit: 5 },
    retries: 2,
  },
  async ({ event }) => {
    const { riotAccountId } = event.data as { riotAccountId: string };

    // Look up userId from account
    const account = await prisma.riotAccount.findUnique({
      where: { id: riotAccountId },
      select: { userId: true },
    });
    if (!account) return { skipped: "account_not_found" };

    const { userId } = account;

    // ── Plan limit check — silently skip if over budget ───────────────────────
    const limits = await getPlanLimits(userId);
    const monthStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    if (limits.reportsPerMonth !== -1) {
      const monthCount = await prisma.coachingReport.count({
        where: { riotAccount: { userId }, createdAt: { gte: monthStart }, status: { in: ["complete", "pending"] } },
      });
      if (monthCount >= limits.reportsPerMonth) {
        logger.info("[autoSession] Monthly limit reached, skipping", { userId });
        return { skipped: "monthly_limit" };
      }
    }

    if (limits.reportsPerDay !== -1) {
      const todayCount = await prisma.coachingReport.count({
        where: { riotAccount: { userId }, createdAt: { gte: todayStart }, status: { in: ["complete", "pending"] } },
      });
      if (todayCount >= limits.reportsPerDay) {
        logger.info("[autoSession] Daily limit reached, skipping", { userId });
        return { skipped: "daily_limit" };
      }
    }

    // ── Dedup: skip if a report was created for this account in the last 3h ──
    const recentReport = await prisma.coachingReport.findFirst({
      where: {
        riotAccountId,
        createdAt: { gte: new Date(Date.now() - DEDUP_WINDOW_MS) },
      },
      select: { id: true },
    });
    if (recentReport) {
      logger.info("[autoSession] Recent report exists, skipping dedup", { riotAccountId });
      return { skipped: "dedup" };
    }

    // ── Fetch 5 most recent ranked match IDs ──────────────────────────────────
    const puuid = await getAccountPuuid(riotAccountId);
    const participants = await prisma.matchParticipant.findMany({
      where: {
        puuid: puuid ?? "",
        match: { queueType: "RANKED_SOLO_5x5" },
      },
      orderBy: { match: { gameStart: "desc" } },
      take: MIN_MATCHES,
      select: { matchId: true },
    });

    if (participants.length < MIN_MATCHES) {
      logger.info("[autoSession] Not enough ranked matches, skipping", { riotAccountId, count: participants.length });
      return { skipped: "not_enough_matches" };
    }

    const matchIds = participants.map((p) => p.matchId);

    // ── Create report and queue the job ───────────────────────────────────────
    const reportId = await createPendingReport(riotAccountId, matchIds, "session_review");

    await inngest.send({
      id: `coaching-${reportId}`,
      name: "coaching/report.requested",
      data: { reportId, riotAccountId, matchIds, reportType: "session_review" },
    });

    logger.info("[autoSession] Auto report queued", { reportId, riotAccountId });
    return { reportId, status: "queued" };
  }
);
