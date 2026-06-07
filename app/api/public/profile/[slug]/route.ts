import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
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
  if (!profile) throw Errors.notFound("Profile");

  return apiSuccess(profile);
}
