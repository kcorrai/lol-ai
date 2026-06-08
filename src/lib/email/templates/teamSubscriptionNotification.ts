function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface TeamSubscriptionCancelledEmailData {
  ownerName: string;
  teams: string[];
  periodEndDate: string;
  appUrl: string;
}

export function buildTeamSubscriptionCancelledEmail(
  data: TeamSubscriptionCancelledEmailData
): { subject: string; html: string } {
  const subject = "Team Plan'ınız iptal edildi";
  const safeOwnerName = escapeHtml(data.ownerName);
  const safeDate = escapeHtml(data.periodEndDate);
  const safeAppUrl = escapeHtml(data.appUrl);
  const teamListHtml = data.teams
    .map((t) => `<li style="margin-bottom:4px;color:#A0AEC0;">${escapeHtml(t)}</li>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="tr">
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
          <tr>
            <td style="background:#0F1629;border-radius:12px 12px 0 0;padding:28px 32px;border-bottom:1px solid #1E2A45;">
              <span style="font-size:18px;font-weight:700;color:#C89B3C;letter-spacing:0.04em;">⚡ LoL AI Coach</span>
            </td>
          </tr>
          <tr>
            <td style="background:#0F1629;padding:32px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#E8E6F0;">
                Team Plan aboneliğiniz iptal edildi
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#A0AEC0;">
                Merhaba <strong style="color:#E8E6F0;">${safeOwnerName}</strong>,
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#A0AEC0;">
                Team Plan aboneliğiniz iptal edildi. Mevcut dönem sona erene kadar (<strong style="color:#E8E6F0;">${safeDate}</strong>) takım özelliklerine erişmeye devam edebilirsiniz.
              </p>
              ${data.teams.length > 0 ? `
              <p style="margin:0 0 8px;font-size:14px;color:#718096;">Etkilenen takımlar:</p>
              <ul style="margin:0 0 24px;padding-left:20px;">
                ${teamListHtml}
              </ul>
              ` : ""}
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#A0AEC0;">
                Bu tarihten sonra takım üyeleriniz takım panosuna erişemeyecek. Aboneliğinizi yeniden aktif etmek isterseniz aşağıdan devam edebilirsiniz.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-radius:8px;background:#C89B3C;">
                    <a href="${safeAppUrl}/settings/billing"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#0A0E1A;text-decoration:none;border-radius:8px;">
                      Aboneliği Yenile →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#070B14;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#4A5568;">
                LoL AI Coach · <a href="${safeAppUrl}" style="color:#4A5568;">lolaicoach.gg</a>
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

export interface TeamSubscriptionExpiredEmailData {
  ownerName: string;
  teams: string[];
  appUrl: string;
}

export function buildTeamSubscriptionExpiredEmail(
  data: TeamSubscriptionExpiredEmailData
): { subject: string; html: string } {
  const subject = "Team Plan erişiminiz sona erdi";
  const safeOwnerName = escapeHtml(data.ownerName);
  const safeAppUrl = escapeHtml(data.appUrl);
  const teamListHtml = data.teams
    .map((t) => `<li style="margin-bottom:4px;color:#A0AEC0;">${escapeHtml(t)}</li>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="tr">
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
          <tr>
            <td style="background:#0F1629;border-radius:12px 12px 0 0;padding:28px 32px;border-bottom:1px solid #1E2A45;">
              <span style="font-size:18px;font-weight:700;color:#C89B3C;letter-spacing:0.04em;">⚡ LoL AI Coach</span>
            </td>
          </tr>
          <tr>
            <td style="background:#0F1629;padding:32px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#E8E6F0;">
                Team Plan erişiminiz sona erdi
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#A0AEC0;">
                Merhaba <strong style="color:#E8E6F0;">${safeOwnerName}</strong>,
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#A0AEC0;">
                Team Plan aboneliğiniz sona erdi. Takım üyeleriniz artık takım panosuna ve paylaşılan analiz özelliklerine erişemeyecek.
              </p>
              ${data.teams.length > 0 ? `
              <p style="margin:0 0 8px;font-size:14px;color:#718096;">Etkilenen takımlar:</p>
              <ul style="margin:0 0 24px;padding-left:20px;">
                ${teamListHtml}
              </ul>
              ` : ""}
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#A0AEC0;">
                Takım verileriniz güvende — Team Plan'ı yeniden aktif ettiğinizde tüm geçmişinize ve üyelerinize geri dönebilirsiniz.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-radius:8px;background:#C89B3C;">
                    <a href="${safeAppUrl}/settings/billing"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#0A0E1A;text-decoration:none;border-radius:8px;">
                      Team Plan'ı Yenile →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#070B14;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#4A5568;">
                LoL AI Coach · <a href="${safeAppUrl}" style="color:#4A5568;">lolaicoach.gg</a>
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
