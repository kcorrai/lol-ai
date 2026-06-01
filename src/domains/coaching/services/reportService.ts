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
