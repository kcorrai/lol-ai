import { prisma } from "@/lib/db/prisma";

export type RatingStats = {
  avgRating: number;
  distribution: Record<string, number>; // "1"–"5" → count
  lowRatedReports: Array<{
    reportId: string;
    rating: number;
    feedback: string | null;
    reportType: string;
    createdAt: Date;
  }>;
  byReportType: Array<{ reportType: string; avgRating: number; count: number }>;
  dailyTrend: Array<{ date: string; avgRating: number; count: number }>;
};

export type AiCostSummary = {
  todayCostUsd: number;
  monthCostUsd: number;
  todayTokens: number;
  todayCacheHitRate: number;   // 0–100
  avgLatencyMs: number;
  byModel: Array<{ model: string; calls: number; costUsd: number; tokens: number }>;
  topReports: Array<{ reportId: string | null; costUsd: number; model: string; createdAt: Date }>;
  totalCalls: number;
  ratings: RatingStats;
};

async function getRatingStats(): Promise<RatingStats> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [rated, lowRated, byType] = await Promise.all([
    prisma.coachingReport.findMany({
      where: { userRating: { not: null }, createdAt: { gte: thirtyDaysAgo } },
      select: { userRating: true, createdAt: true },
    }),
    prisma.coachingReport.findMany({
      where: { userRating: { lte: 2 }, createdAt: { gte: thirtyDaysAgo } },
      select: { id: true, userRating: true, userFeedback: true, reportType: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.coachingReport.groupBy({
      by: ["reportType"],
      where: { userRating: { not: null }, createdAt: { gte: thirtyDaysAgo } },
      _avg: { userRating: true },
      _count: { id: true },
    }),
  ]);

  const avgRating = rated.length > 0
    ? Number((rated.reduce((s, r) => s + (r.userRating ?? 0), 0) / rated.length).toFixed(2))
    : 0;

  const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  for (const r of rated) {
    const k = String(Math.min(5, Math.max(1, r.userRating ?? 0)));
    distribution[k] = (distribution[k] ?? 0) + 1;
  }

  // Daily avg for the last 30 days
  const byDay = new Map<string, { sum: number; count: number }>();
  for (const r of rated) {
    const day = r.createdAt.toISOString().slice(0, 10);
    const prev = byDay.get(day) ?? { sum: 0, count: 0 };
    byDay.set(day, { sum: prev.sum + (r.userRating ?? 0), count: prev.count + 1 });
  }
  const dailyTrend = [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, { sum, count }]) => ({ date, avgRating: Number((sum / count).toFixed(2)), count }));

  return {
    avgRating,
    distribution,
    lowRatedReports: lowRated.map((r) => ({
      reportId: r.id,
      rating: r.userRating ?? 0,
      feedback: r.userFeedback,
      reportType: r.reportType,
      createdAt: r.createdAt,
    })),
    byReportType: byType.map((r) => ({
      reportType: r.reportType,
      avgRating: Number((r._avg.userRating ?? 0).toFixed(2)),
      count: r._count.id,
    })),
    dailyTrend,
  };
}

export async function getAiCostSummary(): Promise<AiCostSummary> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  const monthStart = new Date(now);
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [todayRows, monthRows, allRows, topReports, ratings] = await Promise.all([
    prisma.aiAnalysis.findMany({
      where: { createdAt: { gte: todayStart } },
      select: {
        costUsd: true,
        totalTokens: true,
        cacheHit: true,
        latencyMs: true,
        model: true,
      },
    }),
    prisma.aiAnalysis.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { costUsd: true },
    }),
    prisma.aiAnalysis.groupBy({
      by: ["model"],
      _count: { id: true },
      _sum: { costUsd: true, totalTokens: true },
    }),
    prisma.aiAnalysis.findMany({
      orderBy: { costUsd: "desc" },
      take: 10,
      select: {
        id: true,
        coachingReportId: true,
        costUsd: true,
        model: true,
        createdAt: true,
      },
    }),
    getRatingStats(),
  ]);

  const todayCostUsd = todayRows.reduce((s, r) => s + Number(r.costUsd ?? 0), 0);
  const todayTokens = todayRows.reduce((s, r) => s + r.totalTokens, 0);
  const cacheHits = todayRows.filter((r) => r.cacheHit).length;
  const todayCacheHitRate =
    todayRows.length > 0 ? Math.round((cacheHits / todayRows.length) * 100) : 0;
  const avgLatencyMs =
    todayRows.length > 0
      ? Math.round(todayRows.reduce((s, r) => s + r.latencyMs, 0) / todayRows.length)
      : 0;

  const byModel = allRows.map((r) => ({
    model: r.model,
    calls: r._count.id,
    costUsd: Math.round(Number(r._sum.costUsd ?? 0) * 100000) / 100000,
    tokens: r._sum.totalTokens ?? 0,
  }));

  return {
    todayCostUsd: Math.round(todayCostUsd * 100000) / 100000,
    monthCostUsd: Math.round(Number(monthRows._sum.costUsd ?? 0) * 100000) / 100000,
    todayTokens,
    todayCacheHitRate,
    avgLatencyMs,
    byModel,
    topReports: topReports.map((r) => ({
      reportId: r.coachingReportId,
      costUsd: Math.round(Number(r.costUsd ?? 0) * 100000) / 100000,
      model: r.model,
      createdAt: r.createdAt,
    })),
    totalCalls: allRows.reduce((s, r) => s + r._count.id, 0),
    ratings,
  };
}
