import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import { withAuth } from "@/lib/api/withAuth";
import { getReport } from "@/domains/coaching/services/reportService";
import { getPlanLimits } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { Errors } from "@/lib/api/errors";
import { ReportPDF } from "@/domains/coaching/pdf/ReportPDF";
import type { ReportPDFData } from "@/domains/coaching/pdf/ReportPDF";

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const segments = req.nextUrl.pathname.split("/");
  const reportId = segments.at(-2) ?? "";
  if (!reportId) throw Errors.validation("Missing reportId");

  const report = await getReport(reportId, userId);
  if (report.status !== "complete") throw Errors.validation("Report is not complete yet");

  const limits = await getPlanLimits(userId);
  const isPro = limits.fullCoachingReport;

  // Fetch riot account for player info
  const account = await prisma.riotAccount.findUnique({
    where: { id: report.riotAccountId },
    select: { gameName: true, tagLine: true },
  });

  const latestRank = await prisma.rankedHistory.findFirst({
    where: { riotAccountId: report.riotAccountId, queueType: "RANKED_SOLO_5x5" },
    orderBy: { recordedAt: "desc" },
    select: { tier: true, division: true, lp: true },
  });

  const rankStr = latestRank
    ? `${latestRank.tier} ${latestRank.division} — ${latestRank.lp} LP`
    : null;

  const data: ReportPDFData = {
    reportType: report.reportType as ReportPDFData["reportType"],
    riotId: account ? `${account.gameName}#${account.tagLine}` : "Unknown",
    rank: rankStr,
    createdAt:
      report.createdAt instanceof Date ? report.createdAt.toISOString() : String(report.createdAt),
    matchCount: report.matchesAnalyzed.length,
    summary: report.summary,
    coachPersonaResponse: report.coachPersonaResponse,
    estimatedRankPotential: report.estimatedRankPotential,
    actionItems: report.actionItems as ReportPDFData["actionItems"],
    strengths: isPro ? (report.strengths as ReportPDFData["strengths"]) : null,
    weaknesses: isPro ? (report.weaknesses as ReportPDFData["weaknesses"]) : null,
    championRecommendations: isPro
      ? (report.championRecommendations as ReportPDFData["championRecommendations"])
      : null,
    isPro,
  };

  const element = createElement(ReportPDF, { data }) as ReactElement<DocumentProps>;
  const buffer = await renderToBuffer(element);

  const filename = `lol-ai-coach-${report.reportType}-${reportId.slice(0, 8)}.pdf`;

  return new NextResponse(buffer.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.byteLength),
    },
  });
});
