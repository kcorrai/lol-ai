function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface DataExportEmailData {
  gameName: string;
}

export function buildDataExportEmail({ gameName }: DataExportEmailData): {
  subject: string;
  html: string;
} {
  const subject = "Your data is ready — LoL AI Coach";
  const safeName = escapeHtml(gameName);

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
                Your data copy is ready, ${safeName}!
              </h1>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6C817B;">
                Your data export request has been completed. You can find the ZIP file containing all your account data attached to this email.
              </p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#6C817B;">
                The ZIP file contains:
              </p>
              <ul style="margin:0 0 24px;padding:0 0 0 20px;font-size:14px;line-height:1.8;color:#6C817B;">
                <li><strong style="color:#E9F5EE;">profile.json</strong> — Account and profile information</li>
                <li><strong style="color:#E9F5EE;">riot_accounts.json</strong> — Connected Riot accounts</li>
                <li><strong style="color:#E9F5EE;">matches.json</strong> — Match history and statistics</li>
                <li><strong style="color:#E9F5EE;">coaching_reports.json</strong> — AI coaching reports</li>
                <li><strong style="color:#E9F5EE;">achievements.json</strong> — Earned achievements</li>
                <li><strong style="color:#E9F5EE;">improvement_plans.json</strong> — Improvement plan history</li>
                <li><strong style="color:#E9F5EE;">activity_log.json</strong> — Account activity log</li>
              </ul>

              <p style="margin:0;font-size:12px;line-height:1.6;color:#6C817B;">
                This email was sent automatically to fulfill your data export request.
                For more information about your GDPR rights, please review our privacy policy.
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
