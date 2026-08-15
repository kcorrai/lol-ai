import { escapeHtml } from "./emailShell";

export interface MonthlyMilestoneData {
  gameName: string;
  monthLabel: string;        // e.g. "May 2026"
  gamesThisMonth: number;
  gamesPrevMonth: number;
  winRate: number;
  lpChange: number | null;
  startRank: string | null;
  endRank: string | null;
  bestChampion: string | null;
  bestChampionWinRate: number | null;
  reportsGenerated: number;
  isPro: boolean;
  appUrl: string;
}

export function buildMonthlyMilestoneEmail(
  data: MonthlyMilestoneData
): { subject: string; html: string } {
  const {
    gameName, monthLabel, gamesThisMonth, gamesPrevMonth, winRate,
    lpChange, startRank, endRank, bestChampion, bestChampionWinRate,
    reportsGenerated, isPro, appUrl,
  } = data;

  const safeName    = escapeHtml(gameName);
  const safeMonth   = escapeHtml(monthLabel);
  const safeChamp   = bestChampion ? escapeHtml(bestChampion) : null;
  const safeStart   = startRank ? escapeHtml(startRank) : null;
  const safeEnd     = endRank   ? escapeHtml(endRank)   : null;
  const safeAppUrl  = escapeHtml(appUrl);

  const gamesDelta  = gamesThisMonth - gamesPrevMonth;
  const lpText      = lpChange !== null ? `${lpChange >= 0 ? "+" : ""}${lpChange} LP` : "—";
  const lpColor     = lpChange === null ? "#6C817B" : lpChange >= 0 ? "#C6FF3D" : "#FF5A5A";
  const wrColor     = winRate >= 55 ? "#C6FF3D" : winRate >= 50 ? "#C6FF3D" : "#FF5A5A";
  const gamesColor  = gamesDelta >= 0 ? "#C6FF3D" : "#FF5A5A";

  const rankRow = safeStart && safeEnd && safeStart !== safeEnd
    ? `<p style="margin:0 0 12px;font-size:13px;color:#6C817B;">
        Rank: <strong style="color:#E9F5EE">${safeStart}</strong>
        <span style="margin:0 8px;color:#C6FF3D">→</span>
        <strong style="color:#C6FF3D">${safeEnd}</strong>
       </p>`
    : safeEnd
      ? `<p style="margin:0 0 12px;font-size:13px;color:#6C817B;">Current rank: <strong style="color:#E9F5EE">${safeEnd}</strong></p>`
      : "";

  const champRow = safeChamp
    ? `<p style="margin:0 0 12px;font-size:13px;color:#6C817B;">
        Best champion: <strong style="color:#E9F5EE">${safeChamp}</strong>
        ${bestChampionWinRate !== null ? `<span style="color:#C6FF3D;margin-left:8px">${bestChampionWinRate}% WR</span>` : ""}
       </p>`
    : "";

  const reportsRow = reportsGenerated > 0
    ? `<p style="margin:0 0 12px;font-size:13px;color:#6C817B;">AI reports generated: <strong style="color:#E9F5EE">${reportsGenerated}</strong></p>`
    : "";

  const proUpsell = !isPro
    ? `<tr><td style="padding:0 0 16px">
        <div style="background:#C6FF3D10;border:1px solid #C6FF3D30;border-radius:8px;padding:12px 16px;text-align:center">
          <p style="margin:0 0 4px;font-size:12px;color:#6C817B">Unlock deeper insights and unlimited AI reports</p>
          <a href="${safeAppUrl}/settings/billing" style="font-size:12px;color:#C6FF3D;font-weight:600">Upgrade to Pro →</a>
        </div>
       </td></tr>`
    : "";

  const subject = `Your ${safeMonth} recap — ${gamesThisMonth} games, ${lpText}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080B0A;font-family:system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0C1110;border:1px solid #20302D;border-radius:12px;overflow:hidden">

        <!-- Header -->
        <tr><td style="background:#C6FF3D15;border-bottom:1px solid #20302D;padding:20px 24px">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#C6FF3D">LoL AI Coach</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#E9F5EE">${safeMonth} Recap — ${safeName}</p>
        </td></tr>

        <!-- Stats grid -->
        <tr><td style="padding:24px 24px 16px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="31%" style="text-align:center;padding:14px 8px;background:#17201F;border-radius:8px">
                <p style="margin:0;font-size:24px;font-weight:700;color:#E9F5EE">${gamesThisMonth}</p>
                <p style="margin:4px 0 0;font-size:10px;color:#6C817B">Games</p>
                <p style="margin:2px 0 0;font-size:10px;color:${gamesColor}">${gamesDelta >= 0 ? "+" : ""}${gamesDelta} vs last month</p>
              </td>
              <td width="3%"></td>
              <td width="31%" style="text-align:center;padding:14px 8px;background:#17201F;border-radius:8px">
                <p style="margin:0;font-size:24px;font-weight:700;color:${wrColor}">${winRate}%</p>
                <p style="margin:4px 0 0;font-size:10px;color:#6C817B">Win Rate</p>
              </td>
              <td width="3%"></td>
              <td width="31%" style="text-align:center;padding:14px 8px;background:#17201F;border-radius:8px">
                <p style="margin:0;font-size:24px;font-weight:700;color:${lpColor}">${lpText}</p>
                <p style="margin:4px 0 0;font-size:10px;color:#6C817B">LP Change</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Detail rows -->
        <tr><td style="padding:0 24px 8px">
          ${rankRow}
          ${champRow}
          ${reportsRow}
        </td></tr>

        <!-- Pro upsell -->
        <tr><td style="padding:0 24px">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${proUpsell}

            <!-- CTA -->
            <tr><td style="padding:8px 0 24px;text-align:center">
              <a href="${safeAppUrl}/dashboard" style="display:inline-block;background:#C6FF3D;color:#080B0A;text-decoration:none;font-size:13px;font-weight:700;padding:12px 28px;border-radius:8px">
                View Dashboard →
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="border-top:1px solid #20302D;padding:16px 24px;text-align:center">
          <p style="margin:0;font-size:10px;color:#6C817B">
            LoL AI Coach isn't endorsed by Riot Games ·
            <a href="${safeAppUrl}/privacy" style="color:#6C817B">Privacy</a> ·
            <a href="${safeAppUrl}/settings/profile" style="color:#6C817B">Unsubscribe</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
