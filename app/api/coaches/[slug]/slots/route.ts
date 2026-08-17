import type { NextRequest } from "next/server";
import { z } from "zod";
import { coachSlotsBySlug } from "@/domains/marketplace";
import { apiSuccess } from "@/lib/api/response";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { apiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

// Public: a student has to see when a coach is free before deciding to sign up,
// so this answers without a session. Rate limited like the other public reads —
// it is a computed answer over a month of calendar, not a table lookup.
const SLOTS_RATE_LIMIT = { limit: 60, windowMs: 60_000 };

const Query = z.object({
  listingId: z.string().uuid(),
  days: z.coerce.number().int().min(1).max(60).optional(),
});

// GET /api/coaches/[slug]/slots?listingId=&days=
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
): Promise<Response> {
  const rl = await checkRateLimit(`coach-slots:${getIp(req)}`, SLOTS_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const parsed = Query.safeParse({
    listingId: req.nextUrl.searchParams.get("listingId") ?? undefined,
    days: req.nextUrl.searchParams.get("days") ?? undefined,
  });
  if (!parsed.success) return apiError("VALIDATION_ERROR", "A listing is required.", 422);

  const result = await coachSlotsBySlug(params.slug, parsed.data.listingId, parsed.data.days);
  // Returned rather than thrown: `withAuth` is what turns an `ApiError` into a
  // response, and this route has no wrapper — a thrown one would surface as a
  // 500. Public handlers own their own error shape.
  if (!result) return apiError("RESOURCE_NOT_FOUND", "Coach or listing not found", 404);

  return apiSuccess(result);
}
