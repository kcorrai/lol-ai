import { NextRequest, NextResponse } from "next/server";
import { sendMonthlyMilestoneReports } from "@/domains/coaching/services/monthlyMilestoneService";
import { checkCronAuth } from "@/lib/api/cronAuth";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

// Vercel Cron — 1st of each month at 09:00 UTC
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = checkCronAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  logger.info("[cron] monthly-milestone: starting");
  const result = await sendMonthlyMilestoneReports();
  logger.info("[cron] monthly-milestone: done", result);

  return NextResponse.json({ ok: true, ...result });
}
