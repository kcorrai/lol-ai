import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { getRecommendedOtps } from "@/domains/otp/services/otpRecommendationService";

// GET /api/otp/recommendations?riotAccountId=… — data-driven OTP champion recommendations (TASK-235).
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const riotAccountId = req.nextUrl.searchParams.get("riotAccountId");
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  await assertOwnsRiotAccount(userId, riotAccountId);
  const recommendations = await getRecommendedOtps(riotAccountId, 3);
  return apiSuccess({ recommendations });
});
