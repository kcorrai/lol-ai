import { prisma } from "@/lib/db/prisma";
import { getEmailClient, EMAIL_FROM } from "@/lib/email/client";
import { logger } from "@/lib/utils/logger";

interface WeeklyStats {
  gamesPlayed: number;
  wins: number;
  lpChange: number | null;    // null if no ranked data
  csMinChange: number | null; // null if < 2 weeks of data
  biggestWeakness: string | null;
  topChampion: string | null;
  isPro: boolean;
  gameName: string;
  appUrl: string;
}

function lpComposite(tier: string, division: string, lp: number): number {
  const tierIndex: Record<string, number> = {
    IRON: 0, BRONZE: 1, SILVER: 2, GOLD: 3, PLATINUM: 4,
    EMERALD: 5, DIAMOND: 6, MASTER: 7, GRANDMASTER: 8, CHALLENGER: 9,
  };
  const divIndex: Record<string, number> = { IV: 0, III: 1, II: 2, I: 3 };
  return (tierIndex[tier] ?? 0) * 400 + (divIndex[division] ?? 0) * 100 + lp;
}

async function buildWeeklyStats(
  riotAccountId: string,
  userId: string
): Promise<WeeklyStats | null> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const account = await prisma.riotAccount.findUnique({
    where: { id: riotAccountId },
    select: { gameName: true },
  });
  if (!account) return null;

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  });
  const isPro =
    (subscription?.plan === "pro" || subscription?.plan === "elite") &&
    (subscription?.status === "active" || subscription?.status === "trialing");

  // Games this week
  const thisWeekParticipants = await prisma.matchParticipant.findMany({
    where: {
      riotAccountId,
      match: {
        queueType: "RANKED_SOLO_5x5",
        gameStart: { gte: weekAgo },
      },
    },
    select: {
      won: true,
      csPerMinute: true,
      championName: true,
    },
  });

  if (thisWeekParticipants.length === 0) return null;

  const gamesPlayed = thisWeekParticipants.length;
  const wins = thisWeekParticipants.filter((p) => p.won).length;

  // CS/min comparison vs previous week
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

  // LP change this week
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

  // Biggest weakness from most recent complete report
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

  return {
    gamesPlayed,
    wins,
    lpChange,
    csMinChange,
    biggestWeakness,
    topChampion,
    isPro,
    gameName: account.gameName,
    appUrl,
  };
}

function renderEmail(stats: WeeklyStats): { subject: string; html: string } {
  const { gamesPlayed, wins, lpChange, csMinChange, biggestWeakness, topChampion, isPro, gameName, appUrl } = stats;
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

  const proSection = isPro
    ? `
    <tr><td style="padding:0 0 16px">
      <div style="background:#C89B3C15;border:1px solid #C89B3C40;border-radius:8px;padding:12px 16px">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#C89B3C">AI Insights</p>
        ${biggestWeakness ? `<p style="margin:0 0 6px;font-size:12px;color:#8899BB">Top focus area: <strong style="color:#E8F0FF">${biggestWeakness}</strong></p>` : ""}
        ${topChampion ? `<p style="margin:0;font-size:12px;color:#8899BB">Recommended champion: <strong style="color:#E8F0FF">${topChampion}</strong></p>` : ""}
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
          <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#E8F0FF">Weekly Update — ${gameName}</p>
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
            LoL AI Coach isn't endorsed by Riot Games · <a href="${appUrl}/privacy" style="color:#8899BB">Privacy</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return {
    subject: `Weekly Update: ${wins}W ${losses}L, ${lpText} — ${gameName}`,
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

  // All users with a verified email and at least one connected Riot account
  const users = await prisma.user.findMany({
    where: {
      email: { not: null },
      riotAccounts: { some: {} },
    },
    select: {
      id: true,
      email: true,
      riotAccounts: { select: { id: true }, take: 1 },
    },
  });

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of users) {
    if (!user.email) {
      skipped++;
      continue;
    }

    const primaryAccountId = user.riotAccounts[0]?.id;
    if (!primaryAccountId) {
      skipped++;
      continue;
    }

    try {
      const stats = await buildWeeklyStats(primaryAccountId, user.id);
      if (!stats) {
        skipped++;
        continue;
      }

      const { subject, html } = renderEmail(stats);

      await emailClient.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject,
        html,
      });

      sent++;
    } catch (err) {
      logger.error("[weekly-report] Failed for user", { userId: user.id, err });
      errors++;
    }
  }

  return { sent, skipped, errors };
}
