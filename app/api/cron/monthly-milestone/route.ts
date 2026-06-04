import { NextRequest, NextResponse } from "next/server";
import { sendMonthlyMilestoneReports } from "@/domains/coaching/services/monthlyMilestoneService";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

// Vercel Cron — 1st of each month at 09:00 UTC
export async function GET(req: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    logger.error("[cron] CRON_SECRET not set");
    return NextResponse.json({ error: "Cron is not configured" }, { status: 500 });
  }

  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.info("[cron] monthly-milestone: starting");
  const result = await sendMonthlyMilestoneReports();
  logger.info("[cron] monthly-milestone: done", result);

  return NextResponse.json({ ok: true, ...result });
}
