import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { createLsCheckoutUrl } from "@/lib/lemonsqueezy/subscriptionService";

const CHECKOUT_LIMIT = { limit: 5, windowMs: 3_600_000 };
const bodySchema = z.object({ period: z.enum(["monthly", "annual"]).default("monthly") }).optional();

export const POST = withAuth(async (req: NextRequest, { userId, userEmail }) => {
  const ip = getIp(req);
  const rateCheck = await checkRateLimit(`ls-checkout:${ip}`, CHECKOUT_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

  let period: "monthly" | "annual" = "monthly";
  try {
    const body = await req.json() as unknown;
    const parsed = bodySchema.safeParse(body);
    if (parsed.success && parsed.data?.period) period = parsed.data.period;
  } catch { /* empty body is fine */ }

  const url = await createLsCheckoutUrl(userId, userEmail, period);
  return apiSuccess({ url });
});
