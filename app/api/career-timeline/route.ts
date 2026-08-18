import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { getCareerTimeline } from "@/domains/analysis/services/careerTimelineService";

export const dynamic = "force-dynamic";

// GET /api/career-timeline?riotAccountId=… — the whole career as bands of events
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const riotAccountId = req.nextUrl.searchParams.get("riotAccountId");
  if (!riotAccountId) throw Errors.validation("riotAccountId is required");

  await assertOwnsRiotAccount(userId, riotAccountId);

  return apiSuccess(await getCareerTimeline(userId, riotAccountId));
});
