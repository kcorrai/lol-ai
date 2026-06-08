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

export function buildDataExportEmail({ gameName }: DataExportEmailData): { subject: string; html: string } {
  const subject = "Verileriniz hazır — LoL AI Coach";
  const safeName = escapeHtml(gameName);

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
                Verilerinin kopyası hazır, ${safeName}!
              </h1>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#8899BB;">
                Talep ettiğin veri dışa aktarımı tamamlandı. Tüm hesap verilerini içeren ZIP dosyasını bu e-postanın ekinde bulabilirsin.
              </p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#8899BB;">
                ZIP dosyası şunları içeriyor:
              </p>
              <ul style="margin:0 0 24px;padding:0 0 0 20px;font-size:14px;line-height:1.8;color:#8899BB;">
                <li><strong style="color:#E8F0FF;">profile.json</strong> — Hesap ve profil bilgileri</li>
                <li><strong style="color:#E8F0FF;">riot_accounts.json</strong> — Bağlı Riot hesapları</li>
                <li><strong style="color:#E8F0FF;">matches.json</strong> — Maç geçmişi ve istatistikler</li>
                <li><strong style="color:#E8F0FF;">coaching_reports.json</strong> — AI koçluk raporları</li>
                <li><strong style="color:#E8F0FF;">achievements.json</strong> — Kazanılan başarımlar</li>
                <li><strong style="color:#E8F0FF;">improvement_plans.json</strong> — Gelişim planı geçmişi</li>
                <li><strong style="color:#E8F0FF;">activity_log.json</strong> — Hesap aktivite kaydı</li>
              </ul>

              <p style="margin:0;font-size:12px;line-height:1.6;color:#5566AA;">
                Bu e-posta, veri dışa aktarma talebini yerine getirmek için otomatik olarak gönderilmiştir.
                GDPR kapsamındaki haklarınız hakkında daha fazla bilgi için gizlilik politikamızı inceleyebilirsiniz.
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
