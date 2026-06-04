import { NextRequest, NextResponse } from "next/server";
import { sendWeeklyReports } from "@/domains/coaching/services/weeklyReportService";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

// Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
// Schedule: every Monday at 09:00 UTC — see vercel.json
export async function GET(req: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;

  // CRON_SECRET must be set — a missing secret is a misconfiguration, not a
  // reason to allow unauthenticated access to a mass email trigger.
  if (!cronSecret) {
    logger.error("[cron] CRON_SECRET env var is not set — refusing to execute");
    return NextResponse.json({ error: "Cron is not configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.info("[cron] weekly-report: starting");

  const result = await sendWeeklyReports();

  logger.info("[cron] weekly-report: done", result);

  return NextResponse.json({ ok: true, ...result });
}
