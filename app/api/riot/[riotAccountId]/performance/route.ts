import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { getPlayerPerformanceProfile } from "@/domains/analysis/services/matchAnalysisService";

// Path: /api/riot/[riotAccountId]/performance
export const GET = withAuth(
  async (req: NextRequest, { userId }) => {
    const segments = req.nextUrl.pathname.split("/");
    const riotAccountId = segments.at(-2) ?? "";
    if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

    await assertOwnsRiotAccount(userId, riotAccountId);
    const profile = await getPlayerPerformanceProfile(riotAccountId, 20);
    return apiSuccess(profile);
  },
  { deviceAccess: true }
);
