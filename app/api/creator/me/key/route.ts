import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { Errors } from "@/lib/api/errors";
import { apiSuccess } from "@/lib/api/response";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { rotateOverlayKey } from "@/domains/creator/services/creatorProfileService";

export const dynamic = "force-dynamic";

// Rotating invalidates every OBS source and every chat command at once, because
// one key covers both (ADR-026). Rate-limited hard: there is no reason to do
// this more than a handful of times, and each one costs the creator a re-paste.
export const POST = withAuth(async (_req: NextRequest, { userId }): Promise<NextResponse> => {
  const rl = await checkRateLimit(`creator-rotate:${userId}`, { limit: 5, windowMs: 3_600_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const kit = await rotateOverlayKey(userId);
  if (!kit) throw Errors.notFound("Creator profile");

  return apiSuccess({ kit });
});
