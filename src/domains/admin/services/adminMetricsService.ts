import { prismaReadonly } from "@/lib/db/prismaReadonly";

export interface AdminMetrics {
  dau: number;
  mau: number;
  totalUsers: number;
  proUsers: number;
  conversionRate: number;
  funnel: {
    registered: number;
    riotConnected: number;
    firstReport: number;
    proPlan: number;
  };
  featureUsage: { label: string; count: number }[];
  newSignupsLast7Days: number;
}

export async function getAdminMetrics(rangeDays: number = 30): Promise<AdminMetrics> {
  const now = new Date();
  const rangeStart = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const week7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // All queries in parallel for performance
  const [
    totalUsers,
    proUserCount,
    dauAccounts,
    mauAccounts,
    riotConnectedCount,
    firstReportCount,
    newSignups7Days,
    reportsInRange,
    aiAnalysesInRange,
    recapsInRange,
    matchesInRange,
    achievementsInRange,
    challengesInRange,
  ] = await Promise.all([
    prismaReadonly.user.count(),
    prismaReadonly.subscription.count({ where: { plan: { in: ["pro", "elite"] }, status: { in: ["active", "trialing"] } } }),
    // DAU proxy: Riot accounts synced in last 24h → users who were active
    prismaReadonly.riotAccount.groupBy({ by: ["userId"], where: { updatedAt: { gte: dayAgo } } }),
    // MAU proxy: Riot accounts synced in last 30 days
    prismaReadonly.riotAccount.groupBy({ by: ["userId"], where: { updatedAt: { gte: monthAgo } } }),
    prismaReadonly.user.count({ where: { riotAccounts: { some: {} } } }),
    prismaReadonly.user.count({ where: { riotAccounts: { some: { coachingReports: { some: {} } } } } }),
    prismaReadonly.user.count({ where: { createdAt: { gte: week7Ago } } }),
    prismaReadonly.coachingReport.count({ where: { createdAt: { gte: rangeStart } } }),
    prismaReadonly.aiAnalysis.count({ where: { createdAt: { gte: rangeStart } } }),
    prismaReadonly.seasonRecap.count({ where: { generatedAt: { gte: rangeStart } } }),
    prismaReadonly.matchParticipant.count({ where: { match: { gameStart: { gte: rangeStart } } } }),
    prismaReadonly.userAchievement.count({ where: { earnedAt: { gte: rangeStart } } }),
    prismaReadonly.userChallenge.count({ where: { completedAt: { gte: rangeStart }, completed: true } }),
  ]);

  const conversionRate = totalUsers > 0 ? Math.round((proUserCount / totalUsers) * 1000) / 10 : 0;

  return {
    dau: dauAccounts.length,
    mau: mauAccounts.length,
    totalUsers,
    proUsers: proUserCount,
    conversionRate,
    funnel: {
      registered: totalUsers,
      riotConnected: riotConnectedCount,
      firstReport: firstReportCount,
      proPlan: proUserCount,
    },
    featureUsage: [
      { label: "Koçluk Raporu", count: reportsInRange },
      { label: "AI Analizi", count: aiAnalysesInRange },
      { label: "Senkronize Maç", count: matchesInRange },
      { label: "Sezon Özeti", count: recapsInRange },
      { label: "Rozet Açıldı", count: achievementsInRange },
      { label: "Görev Tamamlandı", count: challengesInRange },
    ].sort((a, b) => b.count - a.count),
    newSignupsLast7Days: newSignups7Days,
  };
}
