export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Shared transactional email chrome (header brand + card body + footer). The
// caller supplies the inner body markup; `unsubscribe` adds the opt-out link.
export function renderEmailShell(opts: {
  title: string;
  contentHtml: string;
  appUrl: string;
  unsubscribe?: boolean;
}): string {
  const safeAppUrl = escapeHtml(opts.appUrl);
  const footerExtra = opts.unsubscribe
    ? `<br/><a href="${safeAppUrl}/settings/profile" style="color:#485954;">Unsubscribe</a>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:#080B0A;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080B0A;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td style="background:#0C1110;border-radius:12px 12px 0 0;padding:28px 32px;border-bottom:1px solid #20302D;">
              <span style="font-size:18px;font-weight:700;color:#C6FF3D;letter-spacing:0.04em;">⚡ LoL AI Coach</span>
            </td>
          </tr>
          <tr>
            <td style="background:#0C1110;padding:32px;">
${opts.contentHtml}
            </td>
          </tr>
          <tr>
            <td style="background:#050706;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#485954;">
                LoL AI Coach · <a href="${safeAppUrl}" style="color:#485954;">lolaicoach.gg</a>${footerExtra}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
