import { prisma } from "@/lib/db/prisma";

export type AiCostSummary = {
  todayCostUsd: number;
  monthCostUsd: number;
  todayTokens: number;
  todayCacheHitRate: number;   // 0–100
  avgLatencyMs: number;
  byModel: Array<{ model: string; calls: number; costUsd: number; tokens: number }>;
  topReports: Array<{ reportId: string | null; costUsd: number; model: string; createdAt: Date }>;
  totalCalls: number;
};

export async function getAiCostSummary(): Promise<AiCostSummary> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  const monthStart = new Date(now);
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [todayRows, monthRows, allRows, topReports] = await Promise.all([
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
  };
}
