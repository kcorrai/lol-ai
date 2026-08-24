import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { getReferralStats } from "@/domains/identity/services/referralService";

export const GET = withAuth(async (_req: NextRequest, { userId }) => {
  const stats = await getReferralStats(userId);
  return apiSuccess(stats);
}, { deviceAccess: true });
