import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { withUserLock } from "@/lib/db/userLock";
import { Errors } from "@/lib/api/errors";
import { assertCanGenerateReport } from "@/lib/auth/authorization";
import type { Prisma, ReportType } from "@prisma/client";

/** Either the singleton client or a transaction client. */
type Db = Prisma.TransactionClient | typeof prisma;

export type ReportSummary = {
  reportId: string;
  reportType: ReportType;
  focusArea: string | null;
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
  reportType: ReportType,
  focusArea?: string,
  // Callers enforcing the report quota must pass the transaction client from `withUserLock` so the
  // count and this insert are atomic (TASK-267).
  db: Db = prisma
): Promise<string> {
  const report = await db.coachingReport.create({
    data: {
      riotAccountId,
      reportType,
      focusArea: focusArea ?? null,
      status: "pending",
      matchesAnalyzed: matchIds,
    },
    select: { id: true },
  });
  return report.id;
}

/**
 * Creates a pending report only if the user's plan quota still allows one, counting and inserting
 * atomically so concurrent requests cannot each pass a stale count (TASK-267).
 *
 * This lives here rather than in the route handler because it is the rule "a report may only exist
 * if quota permits it" — business logic, which route handlers are not allowed to carry
 * (CLAUDE.md §2.2). Callers get quota enforcement by construction instead of having to remember to
 * take the lock.
 *
 * Throws the same `ApiError`s as `assertCanGenerateReport`.
 */
export async function createPendingReportWithinQuota(
  userId: string,
  riotAccountId: string,
  matchIds: string[],
  reportType: ReportType,
  focusArea?: string
): Promise<string> {
  return withUserLock(userId, async (tx) => {
    await assertCanGenerateReport(userId, tx);
    return createPendingReport(riotAccountId, matchIds, reportType, focusArea, tx);
  });
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

export type ReportPage = {
  reports: ReportSummary[];
  nextCursor: string | null;
};

export async function listReports(
  userId: string,
  riotAccountId?: string,
  cursor?: string,
  limit = 20
): Promise<ReportPage> {
  const rows = await prisma.coachingReport.findMany({
    where: {
      riotAccount: { userId },
      ...(riotAccountId ? { riotAccountId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      reportType: true,
      focusArea: true,
      status: true,
      matchesAnalyzed: true,
      summary: true,
      userRating: true,
      createdAt: true,
      completedAt: true,
    },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    reports: page.map((r) => ({
      reportId: r.id,
      reportType: r.reportType,
      focusArea: r.focusArea,
      status: r.status,
      matchesAnalyzed: r.matchesAnalyzed.length,
      summary: r.summary,
      userRating: r.userRating,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
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
