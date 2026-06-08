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

export function buildPlanRenewalEmail({ gameName, appUrl }: PlanRenewalEmailData): { subject: string; html: string } {
  const subject = "Yeni 14 günlük gelişim planın hazır — LoL AI Coach";
  const safeName = escapeHtml(gameName);
  const safeUrl = escapeHtml(`${appUrl}/dashboard`);

  const html = `<!DOCTYPE html>
<html lang="tr">
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
              <span style="font-size:18px;font-weight:700;color:#C89B3C;letter-spacing:0.04em;">LoL AI Coach</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#0F1629;padding:32px 32px 24px;border-radius:0 0 12px 12px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#E8F0FF;">
                Yeni planın hazır, ${safeName}!
              </h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#8899BB;">
                Önceki 14 günlük gelişim planın sona erdi. Performans verilerine göre
                yeni hedefler belirlendi &mdash; <strong style="color:#E8F0FF;">yeni 14 günlük planın aktif.</strong>
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#C89B3C;border-radius:8px;">
                    <a href="${safeUrl}"
                      style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#0A0E1A;text-decoration:none;border-radius:8px;">
                      Planı Gör &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;line-height:1.6;color:#5566AA;">
                Planını iptal etmek istersen hesap ayarlarından bildirimleri kapatabilirsin.
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
