import { NextRequest, NextResponse } from "next/server";
import { checkCronAuth } from "@/lib/api/cronAuth";
import { warmMetaCache } from "@/domains/meta/server";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

// Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
// Schedule: daily at 02:00 UTC — see vercel.json
//
// The op.gg-backed surfaces keep a never-expiring last-good copy, but only for variants somebody
// has already requested. A page nobody visits has no copy, so the day the feed goes away it
// renders empty rather than stale — and that is most of the long tail. This walks the variants on
// a timer so every one of them has a recent copy behind it (LA-70 Faz 0).
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = checkCronAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const result = await warmMetaCache();
  logger.info("[cron] warm-meta: done", { ...result });

  return NextResponse.json({ ok: true, ...result });
}
