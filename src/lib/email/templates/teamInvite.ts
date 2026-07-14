function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface TeamInviteEmailData {
  teamName: string;
  inviterName: string;
  joinUrl: string;
  appUrl: string;
  expiresHours: number;
}

export function buildTeamInviteEmail(
  data: TeamInviteEmailData
): { subject: string; html: string } {
  const subject = `You're invited to join the ${data.teamName} team`;
  const safeTeamName = escapeHtml(data.teamName);
  const safeInviterName = escapeHtml(data.inviterName);
  const safeJoinUrl = escapeHtml(data.joinUrl);
  const safeAppUrl = escapeHtml(data.appUrl);

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
                Team Invitation
              </h1>

              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#A0AEC0;">
                <strong style="color:#E8E6F0;">${safeInviterName}</strong> has invited you to join the
                <strong style="color:#C89B3C;">${safeTeamName}</strong> team.
                With LoL AI Coach, you can track your team's match analyses and coaching reports together.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-radius:8px;background:#C89B3C;">
                    <a href="${safeJoinUrl}"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#0A0E1A;text-decoration:none;border-radius:8px;">
                      Join Team →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#718096;">
                This invitation is valid for ${data.expiresHours} hours. If you don't have an account,
                you'll need to sign up first.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#070B14;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#4A5568;">
                LoL AI Coach · <a href="${safeAppUrl}" style="color:#4A5568;">lolaicoach.gg</a><br/>
                Didn't expect this invitation? You can ignore this email.
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
