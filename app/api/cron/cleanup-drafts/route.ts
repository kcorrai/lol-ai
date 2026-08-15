import { NextRequest, NextResponse } from "next/server";
import { deleteExpiredSeries } from "@/domains/draft/server";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

// Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
// Schedule: daily at 04:00 UTC — see vercel.json
//
// Draft rooms are login-free and cost nothing to create, so without a sweep the
// table grows for as long as the site is up. Series carry a seven-day expiry;
// this is what actually collects them. Games and actions cascade.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.error("[cron] CRON_SECRET env var is not set — refusing to execute");
    return NextResponse.json({ error: "Cron is not configured" }, { status: 500 });
  }

  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await deleteExpiredSeries();
  logger.info("[cron] cleanup-drafts: done", { deleted });

  return NextResponse.json({ ok: true, deleted });
}
