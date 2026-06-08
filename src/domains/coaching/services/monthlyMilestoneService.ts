import { prisma } from "@/lib/db/prisma";
import { getEmailClient, EMAIL_FROM } from "@/lib/email/client";
import { logger } from "@/lib/utils/logger";
import { buildMonthlyMilestoneEmail } from "@/lib/email/templates/monthlyMilestone";
import { lpComposite } from "@/domains/coaching/services/weeklyReportService";

function formatRank(tier: string, division: string, lp: number): string {
  if (["MASTER", "GRANDMASTER", "CHALLENGER"].includes(tier)) return `${tier} ${lp} LP`;
  return `${tier} ${division}`;
}

// Returns "May 2026" style label and idempotency key "2026-05"
function getMonthInfo(now: Date): { label: string; key: string } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const label = now.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return { label, key: `${y}-${String(m).padStart(2, "0")}` };
}

export async function sendMonthlyMilestoneReports(): Promise<{
  sent: number;
  skipped: number;
  errors: number;
}> {
  const emailClient = getEmailClient();
  if (!emailClient) {
    logger.warn("[monthly-milestone] RESEND_API_KEY not set — skipping");
    return { sent: 0, skipped: 0, errors: 0 };
  }

  const now = new Date();
  const { label: monthLabel, key: monthKey } = getMonthInfo(now);

  const monthStart  = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));

  const users = await prisma.user.findMany({
    where: { email: { not: null }, riotAccounts: { some: {} } },
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

  let sent = 0, skipped = 0, errors = 0;

  for (const user of users) {
    if (!user.email) { skipped++; continue; }
    const account = user.riotAccounts[0];
    if (!account) { skipped++; continue; }
    if (user.profile?.emailWeeklyReport === false) { skipped++; continue; }

    const idempotencyKey = `monthly-milestone:${user.id}:${monthKey}`;
    const alreadySent = await prisma.webhookEvent.findUnique({ where: { eventKey: idempotencyKey } });
    if (alreadySent) { skipped++; continue; }

    try {
      // ── This month's games ────────────────────────────────────────
      const thisMonthGames = await prisma.matchParticipant.findMany({
        where: { riotAccountId: account.id, match: { queueType: "RANKED_SOLO_5x5", gameStart: { gte: monthStart } } },
        select: { won: true, championName: true },
      });

      if (thisMonthGames.length === 0) { skipped++; continue; }

      // ── Prev month games (for comparison) ────────────────────────
      const prevMonthCount = await prisma.matchParticipant.count({
        where: { riotAccountId: account.id, match: { queueType: "RANKED_SOLO_5x5", gameStart: { gte: prevMonthStart, lt: monthStart } } },
      });

      // ── Win rate ──────────────────────────────────────────────────
      const wins = thisMonthGames.filter((g) => g.won).length;
      const winRate = Math.round((wins / thisMonthGames.length) * 100);

      // ── Best champion ─────────────────────────────────────────────
      const champMap = new Map<string, { wins: number; games: number }>();
      for (const g of thisMonthGames) {
        const e = champMap.get(g.championName) ?? { wins: 0, games: 0 };
        champMap.set(g.championName, { wins: e.wins + (g.won ? 1 : 0), games: e.games + 1 });
      }
      const bestChampEntry = [...champMap.entries()]
        .filter(([, s]) => s.games >= 3)
        .sort((a, b) => b[1].wins / b[1].games - a[1].wins / a[1].games)[0];
      const bestChampion = bestChampEntry?.[0] ?? null;
      const bestChampionWinRate = bestChampEntry
        ? Math.round((bestChampEntry[1].wins / bestChampEntry[1].games) * 100)
        : null;

      // ── Rank change ───────────────────────────────────────────────
      const endRankRaw = await prisma.rankedHistory.findFirst({
        where: { riotAccountId: account.id, queueType: "RANKED_SOLO_5x5" },
        orderBy: { recordedAt: "desc" },
        select: { tier: true, division: true, lp: true },
      });
      const startRankRaw = await prisma.rankedHistory.findFirst({
        where: { riotAccountId: account.id, queueType: "RANKED_SOLO_5x5", recordedAt: { lt: monthStart } },
        orderBy: { recordedAt: "desc" },
        select: { tier: true, division: true, lp: true },
      });

      const lpChange = endRankRaw && startRankRaw
        ? lpComposite(endRankRaw.tier, endRankRaw.division, endRankRaw.lp) -
          lpComposite(startRankRaw.tier, startRankRaw.division, startRankRaw.lp)
        : null;

      // ── Reports generated ─────────────────────────────────────────
      const reportsGenerated = await prisma.coachingReport.count({
        where: { riotAccountId: account.id, status: "complete", createdAt: { gte: monthStart } },
      });

      const isPro =
        (user.subscription?.plan === "pro" || user.subscription?.plan === "elite" || user.subscription?.plan === "team") &&
        (user.subscription?.status === "active" || user.subscription?.status === "trialing");

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://lolaicoach.gg";

      const { subject, html } = buildMonthlyMilestoneEmail({
        gameName: account.gameName,
        monthLabel,
        gamesThisMonth: thisMonthGames.length,
        gamesPrevMonth: prevMonthCount,
        winRate,
        lpChange,
        startRank: startRankRaw ? formatRank(startRankRaw.tier, startRankRaw.division, startRankRaw.lp) : null,
        endRank: endRankRaw ? formatRank(endRankRaw.tier, endRankRaw.division, endRankRaw.lp) : null,
        bestChampion,
        bestChampionWinRate,
        reportsGenerated,
        isPro,
        appUrl,
      });

      await emailClient.emails.send({ from: EMAIL_FROM, to: user.email, subject, html });
      // Swallow unique-constraint errors from rare concurrent Inngest retries — email already sent.
      await prisma.webhookEvent.create({ data: { eventKey: idempotencyKey } }).catch(() => {});

      sent++;
    } catch (err) {
      logger.error("[monthly-milestone] Failed for user", { userId: user.id, err });
      errors++;
    }
  }

  logger.info("[monthly-milestone] batch complete", { sent, skipped, errors, monthKey });
  return { sent, skipped, errors };
}
