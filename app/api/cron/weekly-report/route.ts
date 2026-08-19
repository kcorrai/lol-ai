import { NextRequest, NextResponse } from "next/server";
import { sendWeeklyReports } from "@/domains/coaching/services/weeklyReportService";
import { checkCronAuth } from "@/lib/api/cronAuth";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

// Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
// Schedule: every Monday at 09:00 UTC — see vercel.json
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = checkCronAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  logger.info("[cron] weekly-report: starting");

  const result = await sendWeeklyReports();

  logger.info("[cron] weekly-report: done", result);

  return NextResponse.json({ ok: true, ...result });
}
