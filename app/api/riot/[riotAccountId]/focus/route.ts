import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import type { FocusItem } from "@/domains/analysis/types/analysis.types";

// Path: /api/riot/[riotAccountId]/focus
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const segments = req.nextUrl.pathname.split("/");
  const riotAccountId = segments.at(-2) ?? "";
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  await assertOwnsRiotAccount(userId, riotAccountId);

  const report = await prisma.coachingReport.findFirst({
    where: { riotAccountId, status: "complete" },
    orderBy: { completedAt: "desc" },
    select: { actionItems: true, completedAt: true },
  });

  if (!report?.actionItems) return apiSuccess(null);

  const items = report.actionItems as Array<{
    priority: number;
    action: string;
    howTo: string;
    expectedImpact: string;
    timeframe: string;
  }>;

  const first = items.sort((a, b) => a.priority - b.priority)[0];
  if (!first) return apiSuccess(null);

  const focus: FocusItem = {
    action: first.action,
    howTo: first.howTo,
    expectedImpact: first.expectedImpact,
    timeframe: first.timeframe,
    reportedAt: report.completedAt?.toISOString() ?? "",
  };

  return apiSuccess(focus);
});
