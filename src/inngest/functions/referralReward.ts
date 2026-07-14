import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { sendPushToUser } from "@/lib/push/pushService";
import { getEmailClient } from "@/lib/email/client";

export const referralReward = inngest.createFunction(
  {
    id: "referral-reward",
    name: "Referral: Award Pro Week to Referrer",
    triggers: [{ event: "referral/converted" }],
  },
  async ({ event }) => {
    const { referrerId } = event.data as { referrerId: string; refereeId: string; referralId: string };

    const user = await prisma.user.findUnique({
      where: { id: referrerId },
      select: { email: true, name: true, proTrialEndsAt: true },
    });
    if (!user) return { skipped: true, reason: "referrer not found" };

    // Extend proTrialEndsAt by 7 days from the later of now or current expiry
    const base = user.proTrialEndsAt && user.proTrialEndsAt > new Date() ? user.proTrialEndsAt : new Date();
    const newExpiry = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: referrerId },
      data: { proTrialEndsAt: newExpiry },
    });

    // Notify referrer via email
    const resend = getEmailClient();
    if (user.email && resend) {
      await resend.emails.send({
        from: "LoL AI Coach <noreply@lolai.coach>",
        to: user.email,
        subject: "Your invitation was accepted — you earned 1 week of free Pro!",
        html: `<p>Hi ${user.name ?? "Coach"},</p>
<p>A player you invited completed their account. Your Pro membership has been extended until <strong>${newExpiry.toLocaleDateString("en-US")}</strong>.</p>
<p>By sending more invitations, you can earn up to 8 weeks of free Pro in total.</p>`,
      }).catch(() => {});
    }

    // Push notification
    await sendPushToUser(referrerId, {
      title: "1 Week Free Pro!",
      body: "Your invitation was accepted. Your Pro membership has been extended by 1 week.",
      url: "/settings/referral",
    }).catch(() => {});

    return { referrerId, newExpiry };
  }
);
