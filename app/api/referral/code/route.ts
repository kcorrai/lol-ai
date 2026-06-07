import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { getOrCreateReferralCode } from "@/domains/identity/services/referralService";

export const GET = withAuth(async (_req: NextRequest, { userId }) => {
  const code = await getOrCreateReferralCode(userId);
  return apiSuccess({ code });
});
