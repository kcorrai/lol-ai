import { NextRequest, NextResponse } from "next/server";
import { deleteExpiredSeries } from "@/domains/draft/server";
import { checkCronAuth } from "@/lib/api/cronAuth";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

// Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
// Schedule: daily at 04:00 UTC — see vercel.json
//
// Draft rooms are login-free and cost nothing to create, so without a sweep the
// table grows for as long as the site is up. Series carry a seven-day expiry;
// this is what actually collects them. Games and actions cascade.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = checkCronAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const deleted = await deleteExpiredSeries();
  logger.info("[cron] cleanup-drafts: done", { deleted });

  return NextResponse.json({ ok: true, deleted });
}
