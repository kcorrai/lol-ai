function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildPasswordResetEmail(resetUrl: string): { subject: string; html: string } {
  const subject = "Reset your LoL AI Coach password";
  const safeUrl = escapeHtml(resetUrl);

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
              <span style="font-size:18px;font-weight:700;color:#C6FF3D;letter-spacing:0.04em;">
                LoL AI Coach
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#0C1110;padding:32px 32px 24px;border-radius:0 0 12px 12px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#E9F5EE;">
                Reset your password
              </h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#6C817B;">
                We received a request to reset the password for your LoL AI Coach account.
                Click the button below to set a new password. This link is valid for
                <strong style="color:#E9F5EE;">1 hour</strong>.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#C6FF3D;border-radius:8px;">
                    <a
                      href="${safeUrl}"
                      style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#080B0A;text-decoration:none;border-radius:8px;"
                    >
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#6C817B;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 28px;font-size:12px;color:#6C817B;word-break:break-all;">
                ${safeUrl}
              </p>

              <p style="margin:0;font-size:12px;line-height:1.6;color:#6C817B;">
                If you didn&apos;t request a password reset, you can safely ignore this email.
                Your password will not be changed.
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
