import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { getPublicProfile } from "@/domains/identity/services/profileService";

export const dynamic = "force-dynamic";

// GET /api/public/profile/[slug] — no auth required
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
): Promise<Response> {
  const rl = await checkRateLimit(`public-profile:${getIp(req)}`, { limit: 60, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const profile = await getPublicProfile(params.slug);
  // Returned rather than thrown. Only `withAuth` turns an `ApiError` into a response,
  // and this route deliberately has no session — so the throw reached the client as a
  // 500, and every unknown slug read as "the site is broken" rather than "no such
  // player". Same reasoning as `/api/overlay/[key]`.
  if (!profile) return apiError("RESOURCE_NOT_FOUND", "Profile not found", 404);

  return apiSuccess(profile);
}
