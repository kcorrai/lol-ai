import { NextRequest, NextResponse } from "next/server";
import { sweepRankSnapshots } from "@/domains/riot/services/rankSnapshotSweepService";
import { checkCronAuth } from "@/lib/api/cronAuth";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

// Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
// Schedule: daily at 03:00 UTC — see vercel.json. The hour is deliberate: it is off-peak for the
// European and Turkish ladders this product serves, so the sample lands between play sessions
// rather than mid-climb.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = checkCronAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  logger.info("[cron] rank-snapshot: starting");

  const result = await sweepRankSnapshots();

  // A sweep that sampled nobody must not answer 200: Vercel's cron monitoring reads the status, and
  // a green run every night while the rank history stands still is the failure this job is for.
  if (result.abortedReason) {
    logger.error("[cron] rank-snapshot: aborted", result);
    return NextResponse.json({ ok: false, ...result }, { status: 503 });
  }

  logger.info("[cron] rank-snapshot: done", result);

  return NextResponse.json({ ok: true, ...result });
}
