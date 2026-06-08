import { inngest } from "@/inngest/client";
import { prismaReadonly } from "@/lib/db/prismaReadonly";
import { getEmailClient, EMAIL_FROM } from "@/lib/email/client";
import { buildDataExportEmail } from "@/lib/email/templates/dataExport";
import { logger } from "@/lib/utils/logger";
import { zipSync, strToU8 } from "fflate";

interface ExportRequestedPayload {
  userId: string;
}

export const gdprExport = inngest.createFunction(
  {
    id: "gdpr-export",
    triggers: [{ event: "account/export.requested" }],
    retries: 2,
  },
  async ({ event }) => {
    const { userId } = event.data as ExportRequestedPayload;

    const [user, riotAccounts, reports, userAchievements, plans, auditLogs] =
      await Promise.all([
        prismaReadonly.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true, createdAt: true, profileSettings: true },
        }),
        prismaReadonly.riotAccount.findMany({
          where: { userId },
          select: { gameName: true, tagLine: true, region: true, createdAt: true },
        }),
        prismaReadonly.coachingReport.findMany({
          where: { riotAccount: { userId } },
          select: {
            id: true,
            reportType: true,
            status: true,
            summary: true,
            createdAt: true,
            completedAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 500,
        }),
        prismaReadonly.userAchievement.findMany({
          where: { userId },
          select: { achievementId: true, earnedAt: true },
          orderBy: { earnedAt: "desc" },
        }),
        prismaReadonly.improvementPlan.findMany({
          where: { riotAccount: { userId } },
          select: {
            id: true,
            riotAccountId: true,
            createdAt: true,
            expiresAt: true,
            status: true,
            targets: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prismaReadonly.auditLog.findMany({
          where: { userId },
          select: { action: true, resource: true, createdAt: true, ipAddress: true },
          orderBy: { createdAt: "desc" },
          take: 1000,
        }),
      ]);

    if (!user?.email) {
      logger.warn("[gdprExport] User not found or has no email", { userId });
      return { skipped: "no_user" };
    }

    const matches = await prismaReadonly.matchParticipant.findMany({
      where: { riotAccount: { userId } },
      select: {
        championName: true,
        position: true,
        kills: true,
        deaths: true,
        assists: true,
        won: true,
        csPerMinute: true,
        visionScore: true,
        match: {
          select: {
            matchId: true,
            gameMode: true,
            gameDuration: true,
            gameStart: true,
          },
        },
      },
      orderBy: { match: { gameStart: "desc" } },
      take: 1000,
    });

    const exportedAt = new Date().toISOString();

    const files: Record<string, Uint8Array> = {
      "profile.json": strToU8(JSON.stringify({ exportedAt, ...user }, null, 2)),
      "riot_accounts.json": strToU8(JSON.stringify({ exportedAt, accounts: riotAccounts }, null, 2)),
      "matches.json": strToU8(JSON.stringify({ exportedAt, total: matches.length, matches }, null, 2)),
      "coaching_reports.json": strToU8(JSON.stringify({ exportedAt, total: reports.length, reports }, null, 2)),
      "achievements.json": strToU8(JSON.stringify({ exportedAt, total: userAchievements.length, achievements: userAchievements }, null, 2)),
      "improvement_plans.json": strToU8(JSON.stringify({ exportedAt, total: plans.length, plans }, null, 2)),
      "activity_log.json": strToU8(JSON.stringify({ exportedAt, total: auditLogs.length, log: auditLogs }, null, 2)),
    };

    const zipBuffer = Buffer.from(zipSync(files));

    const emailClient = getEmailClient();
    if (!emailClient) {
      logger.warn("[gdprExport] No email client, skipping send", { userId });
      return { skipped: "no_email_client" };
    }

    const gameName = riotAccounts[0]?.gameName ?? user.name ?? "Oyuncu";
    const { subject, html } = buildDataExportEmail({ gameName });

    const { error } = await emailClient.emails.send({
      from: EMAIL_FROM,
      to: user.email,
      subject,
      html,
      attachments: [
        {
          filename: `lolai-data-export-${exportedAt.slice(0, 10)}.zip`,
          content: zipBuffer,
          contentType: "application/zip",
        },
      ],
    });

    if (error) {
      logger.error("[gdprExport] Email send failed", { userId, error });
      throw new Error(error.message);
    }

    logger.info("[gdprExport] Export email sent", { userId, email: user.email });
    return { sent: true, filesCount: Object.keys(files).length };
  }
);
