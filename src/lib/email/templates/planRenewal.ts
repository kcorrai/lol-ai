function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface PlanRenewalEmailData {
  gameName: string;
  appUrl: string;
}

export function buildPlanRenewalEmail({ gameName, appUrl }: PlanRenewalEmailData): {
  subject: string;
  html: string;
} {
  const subject = "Your new 14-day improvement plan is ready — LoL AI Coach";
  const safeName = escapeHtml(gameName);
  const safeUrl = escapeHtml(`${appUrl}/dashboard`);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#080B0A;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080B0A;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0C1110;border-radius:12px 12px 0 0;padding:28px 32px;border-bottom:1px solid #20302D;">
              <span style="font-size:18px;font-weight:700;color:#C6FF3D;letter-spacing:0.04em;">LoL AI Coach</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#0C1110;padding:32px 32px 24px;border-radius:0 0 12px 12px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#E9F5EE;">
                Your new plan is ready, ${safeName}!
              </h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#6C817B;">
                Your previous 14-day improvement plan has ended. Based on your performance data,
                new goals have been set &mdash; <strong style="color:#E9F5EE;">your new 14-day plan is now active.</strong>
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#C6FF3D;border-radius:8px;">
                    <a href="${safeUrl}"
                      style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#080B0A;text-decoration:none;border-radius:8px;">
                      View Plan &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;line-height:1.6;color:#6C817B;">
                If you want to cancel your plan, you can disable notifications in your account settings.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 0 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#485954;">
                LoL AI Coach &mdash; AI-powered League of Legends coaching
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
