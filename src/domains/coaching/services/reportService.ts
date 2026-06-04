import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { Errors } from "@/lib/api/errors";
import type { ReportType } from "@prisma/client";

export type ReportSummary = {
  reportId: string;
  reportType: ReportType;
  status: string;
  matchesAnalyzed: number;
  summary: string | null;
  userRating: number | null;
  createdAt: Date;
  completedAt: Date | null;
};

export async function createPendingReport(
  riotAccountId: string,
  matchIds: string[],
  reportType: ReportType
): Promise<string> {
  const report = await prisma.coachingReport.create({
    data: {
      riotAccountId,
      reportType,
      status: "pending",
      matchesAnalyzed: matchIds,
    },
    select: { id: true },
  });
  return report.id;
}

export async function getReport(reportId: string, userId: string) {
  const report = await prisma.coachingReport.findFirst({
    where: { id: reportId, riotAccount: { userId } },
  });
  if (!report) throw Errors.notFound("Coaching report");
  return report;
}

export async function getReportStatus(reportId: string, userId: string) {
  const report = await prisma.coachingReport.findFirst({
    where: { id: reportId, riotAccount: { userId } },
    select: { id: true, status: true },
  });
  if (!report) throw Errors.notFound("Coaching report");
  return report;
}

export async function listReports(
  userId: string,
  riotAccountId?: string,
  limit = 10
): Promise<ReportSummary[]> {
  const reports = await prisma.coachingReport.findMany({
    where: {
      riotAccount: { userId },
      ...(riotAccountId ? { riotAccountId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      reportType: true,
      status: true,
      matchesAnalyzed: true,
      summary: true,
      userRating: true,
      createdAt: true,
      completedAt: true,
    },
  });

  return reports.map((r) => ({
    reportId: r.id,
    reportType: r.reportType,
    status: r.status,
    matchesAnalyzed: r.matchesAnalyzed.length,
    summary: r.summary,
    userRating: r.userRating,
    createdAt: r.createdAt,
    completedAt: r.completedAt,
  }));
}

// ── Share token ──────────────────────────────────────────────────────────────

export type PublicReport = {
  reportId: string;
  reportType: ReportType;
  summary: string | null;
  coachPersonaResponse: string | null;
  firstActionItem: { action: string; expectedImpact: string } | null;
  gameName: string;
  tagLine: string;
  region: string;
  rankDisplay: string | null;
  topChampionName: string | null;
  completedAt: Date | null;
};

export async function generateShareToken(
  reportId: string,
  userId: string
): Promise<string> {
  const report = await prisma.coachingReport.findFirst({
    where: { id: reportId, riotAccount: { userId }, status: "complete" },
    select: { id: true, shareToken: true },
  });
  if (!report) throw Errors.notFound("Coaching report");
  if (report.shareToken) return report.shareToken;

  const token = randomBytes(16).toString("hex");

  // Atomically set token only if still null — prevents race condition where two
  // concurrent requests both read null, generate different tokens, and the second
  // write silently overwrites the first, breaking already-distributed share links.
  const updated = await prisma.coachingReport.updateMany({
    where: { id: reportId, shareToken: null },
    data: { shareToken: token },
  });

  if (updated.count === 0) {
    const refreshed = await prisma.coachingReport.findUnique({
      where: { id: reportId },
      select: { shareToken: true },
    });
    return refreshed!.shareToken!;
  }

  return token;
}

export async function getPublicReport(shareToken: string): Promise<PublicReport> {
  if (!shareToken || shareToken.length < 8) throw Errors.notFound("Shared report");

  const report = await prisma.coachingReport.findUnique({
    where: { shareToken },
    select: {
      id: true,
      reportType: true,
      summary: true,
      coachPersonaResponse: true,
      actionItems: true,
      championRecommendations: true,
      completedAt: true,
      shareToken: true,
      riotAccount: {
        select: {
          gameName: true,
          tagLine: true,
          region: true,
          rankedHistory: {
            where: { queueType: "RANKED_SOLO_5x5" },
            orderBy: { recordedAt: "desc" },
            take: 1,
            select: { tier: true, division: true },
          },
        },
      },
    },
  });
  if (!report || !report.shareToken) throw Errors.notFound("Shared report");

  const items = report.actionItems as Array<{ action: string; expectedImpact: string }> | null;
  const champRecs = report.championRecommendations as Array<{ championName: string; priority: string }> | null;
  const latestRank = report.riotAccount.rankedHistory[0];

  const rankDisplay = latestRank
    ? `${latestRank.tier.charAt(0).toUpperCase() + latestRank.tier.slice(1).toLowerCase()} ${latestRank.division}`
    : null;

  const topChampionName =
    champRecs?.find((c) => c.priority === "high")?.championName ??
    champRecs?.[0]?.championName ??
    null;

  return {
    reportId: report.id,
    reportType: report.reportType,
    summary: report.summary,
    coachPersonaResponse: report.coachPersonaResponse,
    firstActionItem: items?.[0] ?? null,
    gameName: report.riotAccount.gameName,
    tagLine: report.riotAccount.tagLine,
    region: report.riotAccount.region,
    rankDisplay,
    topChampionName,
    completedAt: report.completedAt,
  };
}

export async function submitRating(
  reportId: string,
  userId: string,
  rating: number,
  feedback?: string
): Promise<void> {
  if (rating < 1 || rating > 5) throw Errors.validation("Rating must be between 1 and 5");
  const report = await prisma.coachingReport.findFirst({
    where: { id: reportId, riotAccount: { userId } },
    select: { id: true },
  });
  if (!report) throw Errors.notFound("Coaching report");
  await prisma.coachingReport.update({
    where: { id: reportId },
    data: { userRating: rating, userFeedback: feedback ?? null },
  });
}
