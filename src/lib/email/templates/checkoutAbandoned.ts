import { escapeHtml, renderEmailShell } from "./emailShell";

export interface CheckoutAbandonedEmailData {
  name: string;
  checkoutUrl: string;
  hasCoupon: boolean;
  appUrl: string;
}

export function buildCheckoutAbandonedEmail(
  data: CheckoutAbandonedEmailData
): { subject: string; html: string } {
  const subject = data.hasCoupon
    ? "Your Pro upgrade is waiting — here's a discount to finish"
    : "You left your Pro upgrade behind";
  const safeName = escapeHtml(data.name);
  const safeUrl = escapeHtml(data.checkoutUrl);

  const discountLine = data.hasCoupon
    ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#A7BCB5;">
                As a welcome back, a discount is already applied at checkout.
              </p>`
    : "";

  const contentHtml = `<h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#E9F5EE;">
                Finish upgrading to Pro
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#A7BCB5;">
                Hi <strong style="color:#E9F5EE;">${safeName}</strong>, you started upgrading to LoL AI Coach Pro but didn't finish.
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#A7BCB5;">
                Pro unlocks unlimited AI coaching reports on your own games, full counter lists, matchup intelligence, champion mastery scores and a personal climb plan.
              </p>
              ${discountLine}
              <table cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
                <tr>
                  <td style="border-radius:8px;background:#C6FF3D;">
                    <a href="${safeUrl}"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#080B0A;text-decoration:none;border-radius:8px;">
                      Complete your upgrade →
                    </a>
                  </td>
                </tr>
              </table>`;

  return {
    subject,
    html: renderEmailShell({ title: subject, contentHtml, appUrl: data.appUrl, unsubscribe: true }),
  };
}
