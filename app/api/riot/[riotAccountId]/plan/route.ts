import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { getActivePlan, generatePlan } from "@/domains/analysis/services/improvementPlanService";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";

// Rebuilding a plan reads the last 20 games back out and writes a fresh row every time, and
// nothing else bounds how often it may be asked for: ownership says whose account it is, not
// how many times a minute. A plan covers a fortnight, so a handful an hour is already far
// more than using the feature needs and still far less than a loop would cost us.
const GENERATE_LIMIT = { limit: 10, windowMs: 3_600_000 };

function extractId(req: NextRequest): string {
  const id = req.nextUrl.pathname.split("/").at(-2) ?? "";
  if (!id) throw Errors.validation("Missing riotAccountId");
  return id;
}

// GET /api/riot/[riotAccountId]/plan
export const GET = withAuth(
  async (req: NextRequest, { userId }) => {
    const riotAccountId = extractId(req);
    await assertOwnsRiotAccount(userId, riotAccountId);
    const plan = await getActivePlan(riotAccountId);
    return apiSuccess(plan);
  },
  { deviceAccess: true }
);

// POST /api/riot/[riotAccountId]/plan
export const POST = withAuth(
  async (req: NextRequest, { userId }) => {
    const riotAccountId = extractId(req);
    await assertOwnsRiotAccount(userId, riotAccountId);

    const rate = await checkRateLimit(`plan:${userId}`, GENERATE_LIMIT);
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterMs, rate.limit);

    const plan = await generatePlan(riotAccountId);
    return apiSuccess(plan);
  },
  { deviceAccess: true }
);
