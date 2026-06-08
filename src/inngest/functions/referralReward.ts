import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { sendPushToUser } from "@/lib/push/pushService";
import { resend } from "@/lib/email/resend";

export const referralReward = inngest.createFunction(
  { id: "referral-reward", name: "Referral: Award Pro Week to Referrer" },
  { event: "referral/converted" },
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
    if (user.email) {
      await resend.emails.send({
        from: "LoL AI Coach <noreply@lolai.coach>",
        to: user.email,
        subject: "Davetiniz kabul edildi — 1 hafta ücretsiz Pro kazandınız!",
        html: `<p>Merhaba ${user.name ?? "Koç"},</p>
<p>Davet ettiğiniz bir oyuncu hesabını tamamladı. Pro üyeliğiniz <strong>${newExpiry.toLocaleDateString("tr-TR")}</strong> tarihine kadar uzatıldı.</p>
<p>Daha fazla davet göndererek toplamda 8 haftaya kadar ücretsiz Pro kazanabilirsiniz.</p>`,
      }).catch(() => {});
    }

    // Push notification
    await sendPushToUser(referrerId, {
      title: "1 Hafta Ücretsiz Pro!",
      body: "Davetiniz kabul edildi. Pro üyeliğiniz 1 hafta uzatıldı.",
      url: "/settings/referral",
    }).catch(() => {});

    return { referrerId, newExpiry };
  }
);
