import { prisma } from "@/lib/db/prisma";

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
    prisma.user.count(),
    prisma.subscription.count({ where: { plan: { in: ["pro", "elite"] }, status: { in: ["active", "trialing"] } } }),
    // DAU proxy: Riot accounts synced in last 24h → users who were active
    prisma.riotAccount.groupBy({ by: ["userId"], where: { updatedAt: { gte: dayAgo } } }),
    // MAU proxy: Riot accounts synced in last 30 days
    prisma.riotAccount.groupBy({ by: ["userId"], where: { updatedAt: { gte: monthAgo } } }),
    prisma.user.count({ where: { riotAccounts: { some: {} } } }),
    prisma.user.count({ where: { riotAccounts: { some: { coachingReports: { some: {} } } } } }),
    prisma.user.count({ where: { createdAt: { gte: week7Ago } } }),
    prisma.coachingReport.count({ where: { createdAt: { gte: rangeStart } } }),
    prisma.aiAnalysis.count({ where: { createdAt: { gte: rangeStart } } }),
    prisma.seasonRecap.count({ where: { generatedAt: { gte: rangeStart } } }),
    prisma.matchParticipant.count({ where: { match: { gameStart: { gte: rangeStart } } } }),
    prisma.userAchievement.count({ where: { earnedAt: { gte: rangeStart } } }),
    prisma.userChallenge.count({ where: { completedAt: { gte: rangeStart }, completed: true } }),
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
