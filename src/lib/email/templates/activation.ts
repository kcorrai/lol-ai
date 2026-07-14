function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface ActivationEmailData {
  gameName: string;
  appUrl: string;
}

export function buildActivationEmail(data: ActivationEmailData): { subject: string; html: string } {
  const subject = `${data.gameName}, your first AI report is waiting for you`;
  const safeName = escapeHtml(data.gameName);
  const safeUrl = escapeHtml(data.appUrl);

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
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#E8E6F0;">
                Riot account connected, ${safeName}!
              </h1>

              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#A0AEC0;">
                We've read your match history. Your AI coach can now analyze your matches and tell you where you went wrong.
              </p>

              <!-- Steps -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#1A2035;border-radius:10px;padding:20px 24px;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="color:#4ade80;font-weight:700;margin-right:10px;">✓</span>
                          <span style="font-size:14px;color:#CBD5E0;">Riot account connected</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="color:#C89B3C;font-weight:700;margin-right:10px;">→</span>
                          <span style="font-size:14px;color:#E8E6F0;font-weight:600;">Get your first AI report</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="color:#4A5568;font-weight:700;margin-right:10px;">○</span>
                          <span style="font-size:14px;color:#718096;">Create a personal improvement plan</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:#C89B3C;">
                    <a href="${safeUrl}/coaching"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#0A0E1A;text-decoration:none;border-radius:8px;">
                      Get My First Report →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:13px;color:#718096;">
                Your report will be ready in 1-2 minutes. We automatically sync your account every day.
              </p>
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
