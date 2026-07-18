import { escapeHtml, type WeeklyStats } from "./weeklyEmailRenderer";

// HTML email template for the weekly update. Kept separate from the data
// builder so the renderer stays a pure stats → { subject, html } transform.
export function renderWeeklyEmail(stats: WeeklyStats): { subject: string; html: string } {
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
