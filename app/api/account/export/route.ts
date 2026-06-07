import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { prismaReadonly } from "@/lib/db/prismaReadonly";
import { audit } from "@/lib/audit/auditService";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";

// Export is expensive — limit to 2 per hour
const EXPORT_LIMIT = { limit: 2, windowMs: 3_600_000 };

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const rateCheck = await checkRateLimit(`export:${userId}`, EXPORT_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

  const [user, riotAccounts, reports, auditLogs] = await Promise.all([
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
      take: 200,
    }),
    prismaReadonly.auditLog.findMany({
      where: { userId },
      select: { action: true, resource: true, createdAt: true, ipAddress: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  await audit({
    userId,
    action: "data.export.requested",
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  const exportData = {
    exportedAt: new Date().toISOString(),
    user,
    riotAccounts,
    coachingReports: reports,
    activityLog: auditLogs,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="lolai-export-${userId}.json"`,
    },
  });
});
