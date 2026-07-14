function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  session_review: "Session Review",
  climb_roadmap: "Rank Climb Roadmap",
  champion_deep_dive: "Champion Deep Dive",
  mental_coaching: "Mental Coaching",
};

export interface ReportReadyEmailData {
  gameName: string;
  reportType: string;
  reportId: string;
  appUrl: string;
}

export function buildReportReadyEmail(data: ReportReadyEmailData): { subject: string; html: string } {
  const label = REPORT_TYPE_LABELS[data.reportType] ?? data.reportType;
  const subject = `${data.gameName}, your report is ready — ${label}`;
  const safeName = escapeHtml(data.gameName);
  const safeLabel = escapeHtml(label);
  const safeUrl = escapeHtml(data.appUrl);
  const reportUrl = `${safeUrl}/coaching`;

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

              <!-- Icon + headline -->
              <div style="text-align:center;margin-bottom:28px;">
                <div style="display:inline-block;background:#4ade8020;border-radius:50%;padding:14px;margin-bottom:12px;">
                  <span style="font-size:28px;">✅</span>
                </div>
                <h1 style="margin:0;font-size:22px;font-weight:700;color:#E8E6F0;">
                  Your report is ready, ${safeName}!
                </h1>
                <p style="margin:8px 0 0;font-size:14px;color:#A0AEC0;">${safeLabel}</p>
              </div>

              <p style="margin:0 0 28px;font-size:14px;line-height:1.7;color:#A0AEC0;text-align:center;">
                Your AI coach has analyzed your matches. Your strengths, areas for improvement,<br/>and next steps are waiting for you.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:8px;background:#C89B3C;">
                    <a href="${reportUrl}"
                       style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#0A0E1A;text-decoration:none;border-radius:8px;">
                      View Report →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:12px;color:#718096;text-align:center;">
                Your report is saved in the app — you can review it anytime.
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
