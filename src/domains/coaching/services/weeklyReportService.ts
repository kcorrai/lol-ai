import { prisma } from "@/lib/db/prisma";
import { getEmailClient, EMAIL_FROM } from "@/lib/email/client";
import { logger } from "@/lib/utils/logger";
import { computeRetentionSignals, NUDGE_MESSAGES } from "@/domains/analysis/services/retentionService";

// ── Pure helpers (exported for testing) ─────────────────────────────────────

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Returns ISO 8601 year-week string e.g. "2026-W23".
// Used as the idempotency key suffix so each user gets at most one email per week.
export function getIsoWeekKey(date: Date): string {
  const d = new Date(date.getTime());
  d.setUTCHours(0, 0, 0, 0);
  // Move to the Thursday of the same ISO week (ISO weeks start Monday, pivot on Thursday)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

// ── Internal helpers ─────────────────────────────────────────────────────────

interface WeeklyStats {
  gamesPlayed: number;
  wins: number;
  lpChange: number | null;
  csMinChange: number | null;
  biggestWeakness: string | null;
  topChampion: string | null;
  smartNudge: string | null;
  isPro: boolean;
  gameName: string;
  appUrl: string;
}

export function lpComposite(tier: string, division: string, lp: number): number {
  const tierIndex: Record<string, number> = {
    IRON: 0, BRONZE: 1, SILVER: 2, GOLD: 3, PLATINUM: 4,
    EMERALD: 5, DIAMOND: 6, MASTER: 7, GRANDMASTER: 8, CHALLENGER: 9,
  };
  const divIndex: Record<string, number> = { IV: 0, III: 1, II: 2, I: 3 };
  return (tierIndex[tier] ?? 0) * 400 + (divIndex[division] ?? 0) * 100 + lp;
}

// gameName and isPro are pre-fetched in the batch query to avoid N+1 per user.
// now is injected so time windows are consistent across the batch and testable.
async function buildWeeklyStats(
  riotAccountId: string,
  gameName: string,
  isPro: boolean,
  now: Date
): Promise<WeeklyStats | null> {
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeekParticipants = await prisma.matchParticipant.findMany({
    where: {
      riotAccountId,
      match: { queueType: "RANKED_SOLO_5x5", gameStart: { gte: weekAgo } },
    },
    select: { won: true, csPerMinute: true },
  });

  if (thisWeekParticipants.length === 0) return null;

  const gamesPlayed = thisWeekParticipants.length;
  const wins = thisWeekParticipants.filter((p) => p.won).length;

  const lastWeekParticipants = await prisma.matchParticipant.findMany({
    where: {
      riotAccountId,
      match: {
        queueType: "RANKED_SOLO_5x5",
        gameStart: { gte: twoWeeksAgo, lt: weekAgo },
      },
    },
    select: { csPerMinute: true },
  });

  const avgCs = (arr: { csPerMinute: unknown }[]) =>
    arr.length === 0
      ? null
      : arr.reduce((s, p) => s + Number(p.csPerMinute), 0) / arr.length;

  const thisCs = avgCs(thisWeekParticipants);
  const prevCs = avgCs(lastWeekParticipants);
  const csMinChange =
    thisCs !== null && prevCs !== null
      ? Math.round((thisCs - prevCs) * 10) / 10
      : null;

  const latestRank = await prisma.rankedHistory.findFirst({
    where: { riotAccountId, queueType: "RANKED_SOLO_5x5" },
    orderBy: { recordedAt: "desc" },
    select: { tier: true, division: true, lp: true },
  });
  const weekStartRank = await prisma.rankedHistory.findFirst({
    where: {
      riotAccountId,
      queueType: "RANKED_SOLO_5x5",
      recordedAt: { lte: weekAgo },
    },
    orderBy: { recordedAt: "desc" },
    select: { tier: true, division: true, lp: true },
  });

  const lpChange =
    latestRank && weekStartRank
      ? lpComposite(latestRank.tier, latestRank.division, latestRank.lp) -
        lpComposite(weekStartRank.tier, weekStartRank.division, weekStartRank.lp)
      : null;

  const lastReport = await prisma.coachingReport.findFirst({
    where: { riotAccountId, status: "complete" },
    orderBy: { completedAt: "desc" },
    select: { weaknesses: true, championRecommendations: true },
  });

  const weaknesses = lastReport?.weaknesses as
    | Array<{ area: string; priority: string }> | null | undefined;
  const biggestWeakness =
    weaknesses?.find((w) => w.priority === "high")?.area ??
    weaknesses?.[0]?.area ??
    null;

  const championRecs = lastReport?.championRecommendations as
    | Array<{ championName: string; priority: string }> | null | undefined;
  const topChampion =
    championRecs?.find((c) => c.priority === "high")?.championName ??
    championRecs?.[0]?.championName ??
    null;

  const signals = await computeRetentionSignals(riotAccountId);
  const smartNudge = signals.primaryNudge ? NUDGE_MESSAGES[signals.primaryNudge] ?? null : null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

  return { gamesPlayed, wins, lpChange, csMinChange, biggestWeakness, topChampion, smartNudge, isPro, gameName, appUrl };
}

function renderEmail(stats: WeeklyStats): { subject: string; html: string } {
  const { gamesPlayed, wins, lpChange, csMinChange, biggestWeakness, topChampion, smartNudge, isPro, gameName, appUrl } = stats;

  // Escape all user/AI-derived strings before interpolating into HTML
  const safeGameName = escapeHtml(gameName);
  const safeBiggestWeakness = biggestWeakness ? escapeHtml(biggestWeakness) : null;
  const safeTopChampion = topChampion ? escapeHtml(topChampion) : null;
  const safeSmartNudge = smartNudge ? escapeHtml(smartNudge) : null;

  const losses = gamesPlayed - wins;
  const winRate = Math.round((wins / gamesPlayed) * 100);

  const lpText =
    lpChange !== null
      ? `${lpChange >= 0 ? "+" : ""}${lpChange} LP`
      : "No LP data";

  const csText =
    csMinChange !== null
      ? `${csMinChange >= 0 ? "+" : ""}${csMinChange} CS/min vs last week`
      : "Not enough data for comparison";

  const nudgeSection = safeSmartNudge
    ? `
    <tr><td style="padding:0 0 16px">
      <div style="background:#E6394615;border:1px solid #E6394640;border-radius:8px;padding:12px 16px">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#E63946">Coach Nudge</p>
        <p style="margin:0;font-size:12px;color:#E8F0FF">${safeSmartNudge}</p>
      </div>
    </td></tr>`
    : "";

  const proSection = isPro
    ? `
    <tr><td style="padding:0 0 16px">
      <div style="background:#C89B3C15;border:1px solid #C89B3C40;border-radius:8px;padding:12px 16px">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#C89B3C">AI Insights</p>
        ${safeBiggestWeakness ? `<p style="margin:0 0 6px;font-size:12px;color:#8899BB">Top focus area: <strong style="color:#E8F0FF">${safeBiggestWeakness}</strong></p>` : ""}
        ${safeTopChampion ? `<p style="margin:0;font-size:12px;color:#8899BB">Recommended champion: <strong style="color:#E8F0FF">${safeTopChampion}</strong></p>` : ""}
      </div>
    </td></tr>`
    : `
    <tr><td style="padding:0 0 16px">
      <div style="background:#1A213815;border:1px solid #2A355040;border-radius:8px;padding:12px 16px;text-align:center">
        <p style="margin:0 0 4px;font-size:12px;color:#8899BB">Get AI-powered weekly insights with Pro</p>
        <a href="${appUrl}/settings/billing" style="font-size:12px;color:#C89B3C">Upgrade →</a>
      </div>
    </td></tr>`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0E1A;font-family:system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0F1629;border:1px solid #2A3550;border-radius:12px;overflow:hidden">

        <!-- Header -->
        <tr><td style="background:#C89B3C15;border-bottom:1px solid #2A3550;padding:20px 24px">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#C89B3C">LoL AI Coach</p>
          <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#E8F0FF">Weekly Update — ${safeGameName}</p>
        </td></tr>

        <!-- Content -->
        <tr><td style="padding:24px">
          <table width="100%" cellpadding="0" cellspacing="0">

            <!-- Stats row -->
            <tr><td style="padding:0 0 20px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="text-align:center;padding:12px 8px;background:#1A2138;border-radius:8px">
                    <p style="margin:0;font-size:22px;font-weight:700;color:#E8F0FF">${gamesPlayed}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#8899BB">Games</p>
                  </td>
                  <td width="4%"></td>
                  <td width="33%" style="text-align:center;padding:12px 8px;background:#1A2138;border-radius:8px">
                    <p style="margin:0;font-size:22px;font-weight:700;color:#${winRate >= 50 ? "52B788" : "E63946"}">${winRate}%</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#8899BB">${wins}W ${losses}L</p>
                  </td>
                  <td width="4%"></td>
                  <td width="33%" style="text-align:center;padding:12px 8px;background:#1A2138;border-radius:8px">
                    <p style="margin:0;font-size:22px;font-weight:700;color:#${lpChange === null ? "8899BB" : lpChange >= 0 ? "52B788" : "E63946"}">${lpText}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#8899BB">LP Change</p>
                  </td>
                </tr>
              </table>
            </td></tr>

            <!-- CS/min -->
            <tr><td style="padding:0 0 16px">
              <p style="margin:0;font-size:12px;color:#8899BB">CS/min: <span style="color:#E8F0FF">${csText}</span></p>
            </td></tr>

            ${nudgeSection}

            ${proSection}

            <!-- CTA -->
            <tr><td style="padding:8px 0 0;text-align:center">
              <a href="${appUrl}/dashboard" style="display:inline-block;background:#C89B3C;color:#0A0E1A;text-decoration:none;font-size:13px;font-weight:700;padding:10px 24px;border-radius:8px">
                Open Dashboard →
              </a>
            </td></tr>

          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="border-top:1px solid #2A3550;padding:16px 24px;text-align:center">
          <p style="margin:0;font-size:10px;color:#8899BB">
            LoL AI Coach isn't endorsed by Riot Games ·
            <a href="${appUrl}/privacy" style="color:#8899BB">Privacy</a> ·
            <a href="${appUrl}/settings" style="color:#8899BB">Unsubscribe</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return {
    subject: `Weekly Update: ${wins}W ${losses}L, ${lpText} — ${safeGameName}`,
    html,
  };
}

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

      const { subject, html } = renderEmail(stats);

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
