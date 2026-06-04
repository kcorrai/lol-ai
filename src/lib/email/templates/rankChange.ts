function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface RankChangeEmailData {
  gameName: string;
  previousRank: string;
  newRank: string;
  type: "promotion" | "demotion";
  appUrl: string;
}

export function buildRankChangeEmail(data: RankChangeEmailData): { subject: string; html: string } {
  const isPromo = data.type === "promotion";
  const subject = isPromo
    ? `🏆 You've been promoted to ${data.newRank}!`
    : `You've been demoted to ${data.newRank} — time to bounce back`;

  const safeName = escapeHtml(data.gameName);
  const safePrev = escapeHtml(data.previousRank);
  const safeNew  = escapeHtml(data.newRank);
  const safeUrl  = escapeHtml(data.appUrl);

  const accentColor = isPromo ? "#C89B3C" : "#5B8DD9";
  const headlineText = isPromo
    ? `🎉 Promoted to ${safeNew}!`
    : `Demoted to ${safeNew}`;
  const bodyText = isPromo
    ? `Well played, ${safeName}. You climbed from <strong>${safePrev}</strong> to <strong>${safeNew}</strong>. Keep the momentum — your next session analysis is ready.`
    : `It happens to everyone, ${safeName}. You dropped from <strong>${safePrev}</strong> to <strong>${safeNew}</strong>. Generate a coaching report to pinpoint what to fix before your next session.`;
  const ctaText = isPromo ? "View Dashboard" : "Get Coaching Report";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#0A0E1A;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0E1A;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0F1629;border-radius:12px 12px 0 0;padding:28px 32px;border-bottom:1px solid #1E2A45;">
              <span style="font-size:18px;font-weight:700;color:#C89B3C;letter-spacing:0.04em;">⚡ LoL AI Coach</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#0F1629;padding:32px;">

              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${accentColor};">
                ${headlineText}
              </h1>

              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#A0AEC0;">
                ${bodyText}
              </p>

              <!-- Rank change pill -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background:#1A2035;border:1px solid #2A3550;border-radius:8px;padding:12px 24px;text-align:center;">
                    <span style="font-size:13px;color:#A0AEC0;">${safePrev}</span>
                    <span style="font-size:16px;color:#A0AEC0;margin:0 12px;">→</span>
                    <span style="font-size:15px;font-weight:700;color:${accentColor};">${safeNew}</span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:${accentColor};">
                    <a href="${safeUrl}/dashboard"
                       style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#0A0E1A;text-decoration:none;border-radius:8px;">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#070B14;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#4A5568;">
                LoL AI Coach · <a href="${safeUrl}" style="color:#4A5568;">lolaicoach.gg</a><br/>
                <a href="${safeUrl}/settings/profile" style="color:#4A5568;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
