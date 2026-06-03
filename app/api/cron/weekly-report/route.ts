import { NextRequest, NextResponse } from "next/server";
import { sendWeeklyReports } from "@/domains/coaching/services/weeklyReportService";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

// Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
// Schedule: every Monday at 09:00 UTC — see vercel.json
export async function GET(req: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  logger.info("[cron] weekly-report: starting");

  const result = await sendWeeklyReports();

  logger.info("[cron] weekly-report: done", result);

  return NextResponse.json({ ok: true, ...result });
}
