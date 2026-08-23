import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { checkIsPro } from "@/lib/auth/authorization";
import { createLsCheckoutUrl } from "@/lib/lemonsqueezy/subscriptionService";
import { getEmailClient, EMAIL_FROM } from "@/lib/email/client";
import { buildCheckoutAbandonedEmail } from "@/lib/email/templates/checkoutAbandoned";
import { logger } from "@/lib/utils/logger";

export interface CheckoutStartedPayload {
  userId: string;
  email: string | null;
  period: "monthly" | "annual";
}

// Fired when a user starts a Pro checkout. Waits, then — if they still haven't
// converted — sends a reminder (with the retention coupon when configured).
// Idempotent per user so repeated checkout clicks don't spam.
export const cartAbandonmentReminder = inngest.createFunction(
  {
    id: "cart-abandonment-reminder",
    triggers: [{ event: "checkout/started" }],
    idempotency: "event.data.userId",
    retries: 1,
  },
  async ({ event, step }) => {
    const { userId } = event.data as CheckoutStartedPayload;

    await step.sleep("wait-for-conversion", "2h");

    const isPro = await step.run("check-conversion", () => checkIsPro(userId));
    if (isPro) return { converted: true };

    return step.run("send-reminder", async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, emailOptOut: true },
      });
      if (!user?.email || user.emailOptOut) return { sent: false };

      const emailClient = getEmailClient();
      if (!emailClient) return { sent: false };

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
      const coupon = process.env.LEMONSQUEEZY_RETENTION_COUPON_CODE;
      let checkoutUrl = `${appUrl}/settings/billing`;
      try {
        const base = await createLsCheckoutUrl(userId, user.email, "monthly");
        checkoutUrl = coupon ? `${base}&checkout[coupon]=${encodeURIComponent(coupon)}` : base;
      } catch {
        /* LS unavailable — fall back to the billing page link */
      }

      const { subject, html } = buildCheckoutAbandonedEmail({
        name: user.name ?? "there",
        checkoutUrl,
        hasCoupon: Boolean(coupon),
        appUrl,
      });

      const { error } = await emailClient.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject,
        html,
      });
      if (error) {
        logger.error("[cartAbandonment] email send failed", { userId, error });
        return { sent: false };
      }
      return { sent: true };
    });
  }
);
