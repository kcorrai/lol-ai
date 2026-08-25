import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { getPlanHistory } from "@/domains/analysis/services/improvementPlanService";

// GET /api/riot/[riotAccountId]/plan/history
export const GET = withAuth(
  async (req: NextRequest, { userId }) => {
    const riotAccountId = req.nextUrl.pathname.split("/").at(-3) ?? "";
    if (!riotAccountId) throw Errors.validation("Missing riotAccountId");
    await assertOwnsRiotAccount(userId, riotAccountId);
    const history = await getPlanHistory(riotAccountId);
    return apiSuccess(history);
  },
  { deviceAccess: true }
);
