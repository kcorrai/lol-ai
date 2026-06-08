function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildEmailVerificationEmail(verifyUrl: string): { subject: string; html: string } {
  const subject = "Verify your LoL AI Coach email";
  const safeUrl = escapeHtml(verifyUrl);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0A0E1A;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0E1A;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0F1629;border-radius:12px 12px 0 0;padding:28px 32px;border-bottom:1px solid #1E2A45;">
              <span style="font-size:18px;font-weight:700;color:#C89B3C;letter-spacing:0.04em;">
                LoL AI Coach
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#0F1629;padding:32px 32px 24px;border-radius:0 0 12px 12px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#E8F0FF;">
                Verify your email address
              </h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#8899BB;">
                Thanks for signing up! Click the button below to confirm your email address
                and unlock AI coaching reports. This link expires in
                <strong style="color:#E8F0FF;">24 hours</strong>.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#C89B3C;border-radius:8px;">
                    <a
                      href="${safeUrl}"
                      style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#0A0E1A;text-decoration:none;border-radius:8px;"
                    >
                      Verify Email &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#8899BB;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 28px;font-size:12px;color:#5566AA;word-break:break-all;">
                ${safeUrl}
              </p>

              <p style="margin:0;font-size:12px;line-height:1.6;color:#5566AA;">
                If you didn&apos;t create a LoL AI Coach account, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 0 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#3A4560;">
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
