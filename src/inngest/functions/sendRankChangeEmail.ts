import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { getEmailClient, EMAIL_FROM } from "@/lib/email/client";
import { buildRankChangeEmail } from "@/lib/email/templates/rankChange";
import { sendDiscordWebhook } from "@/lib/discord/webhookService";
import { rankUpEmbed } from "@/lib/discord/embeds";
import { decryptString } from "@/lib/crypto/encrypt";

const TIER_ORDER: Record<string, number> = {
  IRON: 0, BRONZE: 1, SILVER: 2, GOLD: 3, PLATINUM: 4,
  EMERALD: 5, DIAMOND: 6, MASTER: 7, GRANDMASTER: 8, CHALLENGER: 9,
};
const DIV_ORDER: Record<string, number> = { IV: 0, III: 1, II: 2, I: 3 };

function composite(tier: string, division: string): number {
  return (TIER_ORDER[tier] ?? 0) * 4 + (DIV_ORDER[division] ?? 0);
}

function formatRank(tier: string, division: string, lp: number): string {
  if (["MASTER", "GRANDMASTER", "CHALLENGER"].includes(tier)) {
    return `${tier} ${lp} LP`;
  }
  return `${tier} ${division}`;
}

export interface RankChangedPayload {
  riotAccountId: string;
  previousTier: string;
  previousDivision: string;
  previousLp: number;
  newTier: string;
  newDivision: string;
  newLp: number;
}

export const sendRankChangeEmail = inngest.createFunction(
  {
    id: "send-rank-change-email",
    triggers: [{ event: "rank/changed" }],
    concurrency: { limit: 5 },
    retries: 2,
  },
  async ({ event }) => {
    const payload = event.data as RankChangedPayload;

    const prevScore = composite(payload.previousTier, payload.previousDivision);
    const newScore  = composite(payload.newTier, payload.newDivision);

    // Only email on tier or division changes, not just LP movement
    if (prevScore === newScore) return { skipped: "lp_only_change" };

    const type: "promotion" | "demotion" = newScore > prevScore ? "promotion" : "demotion";

    // Look up user email + discord integration
    const account = await prisma.riotAccount.findUnique({
      where: { id: payload.riotAccountId },
      select: {
        gameName: true,
        tagLine: true,
        user: {
          select: {
            email: true,
            discordIntegration: { select: { webhookUrl: true, notifyRankUp: true } },
          },
        },
      },
    });

    if (!account?.user.email) return { skipped: "no_email" };

    const resend = getEmailClient();
    if (!resend) {
      logger.warn("[rankChangeEmail] Resend not configured, skipping");
      return { skipped: "resend_not_configured" };
    }

    const appUrl = process.env.NEXTAUTH_URL ?? "https://lol-ai-three.vercel.app";

    const { subject, html } = buildRankChangeEmail({
      gameName: account.gameName,
      previousRank: formatRank(payload.previousTier, payload.previousDivision, payload.previousLp),
      newRank: formatRank(payload.newTier, payload.newDivision, payload.newLp),
      type,
      appUrl,
    });

    await resend.emails.send({
      from: EMAIL_FROM,
      to: account.user.email,
      subject,
      html,
    });

    logger.info("[rankChangeEmail] Sent", {
      type,
      riotAccountId: payload.riotAccountId,
      from: formatRank(payload.previousTier, payload.previousDivision, payload.previousLp),
      to: formatRank(payload.newTier, payload.newDivision, payload.newLp),
    });

    // Discord webhook for rank changes (promotion only)
    const discord = account?.user?.discordIntegration;
    if (type === "promotion" && discord?.notifyRankUp && discord.webhookUrl) {
      try {
        await sendDiscordWebhook(
          decryptString(discord.webhookUrl),
          rankUpEmbed({
            gameName: account!.gameName,
            tagLine: account!.tagLine ?? "",
            prevTier: payload.previousTier,
            prevDivision: payload.previousDivision,
            prevLp: payload.previousLp,
            newTier: payload.newTier,
            newDivision: payload.newDivision,
            newLp: payload.newLp,
          })
        );
      } catch (err) {
        logger.warn(`[rankChangeEmail] Discord webhook failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return { sent: true, type };
  }
);
