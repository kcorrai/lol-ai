import { escapeHtml, renderEmailShell } from "./emailShell";

function teamListHtml(teams: string[]): string {
  if (teams.length === 0) return "";
  const items = teams
    .map((t) => `<li style="margin-bottom:4px;color:#A7BCB5;">${escapeHtml(t)}</li>`)
    .join("");
  return `
              <p style="margin:0 0 8px;font-size:14px;color:#6C817B;">Affected teams:</p>
              <ul style="margin:0 0 24px;padding-left:20px;">${items}</ul>`;
}

function renewButton(appUrl: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-radius:8px;background:#C6FF3D;">
                    <a href="${escapeHtml(appUrl)}/settings/billing"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#080B0A;text-decoration:none;border-radius:8px;">
                      ${label} →
                    </a>
                  </td>
                </tr>
              </table>`;
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
  const subject = "Your Team Plan has been cancelled";
  const safeOwnerName = escapeHtml(data.ownerName);
  const safeDate = escapeHtml(data.periodEndDate);

  const contentHtml = `<h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#E9F5EE;">
                Your Team Plan subscription has been cancelled
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#A7BCB5;">
                Hi <strong style="color:#E9F5EE;">${safeOwnerName}</strong>,
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#A7BCB5;">
                Your Team Plan subscription has been cancelled. You can continue to access team features until the current period ends (<strong style="color:#E9F5EE;">${safeDate}</strong>).
              </p>${teamListHtml(data.teams)}
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#A7BCB5;">
                After this date, your team members will no longer be able to access the team dashboard. If you want to reactivate your subscription, you can proceed below.
              </p>
              ${renewButton(data.appUrl, "Renew Subscription")}`;

  return { subject, html: renderEmailShell({ title: subject, contentHtml, appUrl: data.appUrl }) };
}

export interface TeamSubscriptionExpiredEmailData {
  ownerName: string;
  teams: string[];
  appUrl: string;
}

export function buildTeamSubscriptionExpiredEmail(
  data: TeamSubscriptionExpiredEmailData
): { subject: string; html: string } {
  const subject = "Your Team Plan access has ended";
  const safeOwnerName = escapeHtml(data.ownerName);

  const contentHtml = `<h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#E9F5EE;">
                Your Team Plan access has ended
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#A7BCB5;">
                Hi <strong style="color:#E9F5EE;">${safeOwnerName}</strong>,
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#A7BCB5;">
                Your Team Plan subscription has expired. Your team members can no longer access the team dashboard and shared analysis features.
              </p>${teamListHtml(data.teams)}
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#A7BCB5;">
                Your team data is safe — when you reactivate Team Plan, you'll be able to return to all your history and members.
              </p>
              ${renewButton(data.appUrl, "Renew Team Plan")}`;

  return { subject, html: renderEmailShell({ title: subject, contentHtml, appUrl: data.appUrl }) };
}
