function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type NudgeType =
  | "stop_queuing"
  | "pool_too_wide"
  | "loss_streak"
  | "death_spike"
  | "cs_drop"
  | "generic";

interface ReengagementEmailData {
  gameName: string;
  nudge: NudgeType;
  lossStreak?: number;
  appUrl: string;
}

interface NudgeCopy {
  subject: string;
  headline: string;
  body: string;
  cta: string;
}

function getNudgeCopy(nudge: NudgeType, gameName: string, lossStreak?: number): NudgeCopy {
  const name = escapeHtml(gameName);

  switch (nudge) {
    case "stop_queuing":
      return {
        subject: "Dur bir dakika — verilerin tilt'te olduğunu gösteriyor",
        headline: "Tilt Uyarısı",
        body: `${name}, son maçlarında kaybettikten hemen sonra yeniden kuyruğa girdiğini görüyoruz. Bu klasik bir tilt döngüsü. Koçun seni analiz etti ve çözüm yolu hazır.`,
        cta: "Koç Analizini Gör",
      };
    case "loss_streak":
      return {
        subject: `${lossStreak ?? "Birkaç"} maçlık seri kaybın var — koçun nedenini biliyor`,
        headline: `${lossStreak ?? "Seri"} Maçlık Kayıp`,
        body: `${name}, ${lossStreak ?? "birkaç"} maçlık bir kayıp serisi yaşadın. Bu durum herkesin başına gelir — önemli olan doğru dersi çıkarmak. AI koçun seni bekliyor.`,
        cta: "Analiz Raporu Al",
      };
    case "pool_too_wide":
      return {
        subject: "Çok fazla şampiyonla oynuyorsun — odaklan ve yüksel",
        headline: "Şampiyon Havuzu Çok Geniş",
        body: `${name}, son 20 maçında çok farklı şampiyonla oynadın. Araştırmalar gösteriyor ki 2-3 şampiyona odaklanmak rank'i en hızlı yükseltme yöntemi. Koçun hangi şampiyonlara odaklanman gerektiğini söylüyor.`,
        cta: "Şampiyon Havuzunu İncele",
      };
    case "death_spike":
      return {
        subject: "Son maçlarında ölüm sayın arttı — bunu çözelim",
        headline: "Ölüm Artışı Tespit Edildi",
        body: `${name}, son birkaç maçındaki ölüm sayın ortalamanın üzerine çıktı. Bu genellikle belirli bir hatanın tekrarlandığını gösteriyor. Koçun tam olarak neyi farklı yapman gerektiğini analiz etti.`,
        cta: "Koç Analizini Gör",
      };
    case "cs_drop":
      return {
        subject: "CS/dk'n düştü — küçük bir düzeltme büyük fark yaratır",
        headline: "CS Performansın Düşüyor",
        body: `${name}, bu hafta CS/dk ortalaması geçen haftanın altında. CS kaybı genellikle görünmez LP kaybıdır. Koçun sana özel bir laning egzersizi hazırladı.`,
        cta: "Koç Analizini Gör",
      };
    case "generic":
    default:
      return {
        subject: `${name}, bir haftadır görünmüyorsun — hesabında neler oldu?`,
        headline: "Seni Özledik",
        body: `${name}, birkaç gündür giriş yapmadın. Hesabında yeni maç verileri olabilir — koçun her zaman analiz yapmaya hazır.`,
        cta: "Dashboarda Dön",
      };
  }
}

export function buildReengagementEmail(data: ReengagementEmailData): { subject: string; html: string } {
  const copy = getNudgeCopy(data.nudge, data.gameName, data.lossStreak);
  const safeUrl = escapeHtml(data.appUrl);

  const ctaHref =
    data.nudge === "pool_too_wide"
      ? `${safeUrl}/champions`
      : `${safeUrl}/dashboard`;

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(copy.subject)}</title>
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

              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#C89B3C;">
                ${escapeHtml(copy.headline)}
              </h1>

              <p style="margin:0 0 28px;font-size:14px;line-height:1.7;color:#A0AEC0;">
                ${escapeHtml(copy.body)}
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:#C89B3C;">
                    <a href="${ctaHref}"
                       style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#0A0E1A;text-decoration:none;border-radius:8px;">
                      ${escapeHtml(copy.cta)} →
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
                <a href="${safeUrl}/settings/profile" style="color:#4A5568;">Abonelikten çık</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: copy.subject, html };
}
