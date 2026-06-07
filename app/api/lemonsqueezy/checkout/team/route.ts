import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { createLsTeamCheckoutUrl } from "@/lib/lemonsqueezy/subscriptionService";

const CHECKOUT_LIMIT = { limit: 5, windowMs: 3_600_000 };

export const POST = withAuth(async (req: NextRequest, { userId, userEmail }) => {
  const ip = getIp(req);
  const rateCheck = await checkRateLimit(`ls-team-checkout:${ip}`, CHECKOUT_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

  const url = await createLsTeamCheckoutUrl(userId, userEmail);
  return apiSuccess({ url });
});
