import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { Errors } from "@/lib/api/errors";
import { apiSuccess } from "@/lib/api/response";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { resetSession } from "@/domains/creator/services/creatorProfileService";

export const dynamic = "force-dynamic";

const Body = z.object({
  // `clear` returns the counters to "since local midnight", which is what a
  // creator who never touches this gets by default.
  action: z.enum(["start", "clear"]).default("start"),
});

export const POST = withAuth(async (req: NextRequest, { userId }): Promise<NextResponse> => {
  const rl = await checkRateLimit(`creator-session:${userId}`, { limit: 60, windowMs: 3_600_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const parsed = Body.safeParse((await req.json().catch(() => null)) ?? {});
  if (!parsed.success) throw Errors.validation("Invalid session action.");

  const kit = await resetSession(userId, parsed.data.action === "start" ? new Date() : null);
  if (!kit) throw Errors.notFound("Creator profile");

  return apiSuccess({ kit });
});
