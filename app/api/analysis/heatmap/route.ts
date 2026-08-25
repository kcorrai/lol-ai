import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { getHeatmapData } from "@/domains/analysis/services/heatmapService";
import { getPlanLimits } from "@/lib/auth/authorization";
import { inngest } from "@/inngest/client";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

// GET /api/analysis/heatmap?riotAccountId=<uuid>&champion=<opt>&timeRange=<opt>&matchCount=<opt>
export const GET = withAuth(
  async (req: NextRequest, { userId }) => {
    const riotAccountId = req.nextUrl.searchParams.get("riotAccountId");
    if (!riotAccountId) throw Errors.validation("riotAccountId is required");

    await assertOwnsRiotAccount(userId, riotAccountId);

    const { matchHistoryDepth } = await getPlanLimits(userId);
    const isPro = matchHistoryDepth > 20;

    const champion = req.nextUrl.searchParams.get("champion") ?? undefined;
    const timeRange = req.nextUrl.searchParams.get("timeRange") ?? undefined;
    const matchCount = parseInt(req.nextUrl.searchParams.get("matchCount") ?? "20", 10);

    const data = await getHeatmapData(riotAccountId, { champion, timeRange, matchCount, isPro });

    // If no data yet, fire background fetcher (non-blocking, once)
    if (!data.hasData) {
      inngest
        .send({ name: "timeline/fetch-for-account", data: { riotAccountId } })
        .catch((err) => logger.warn("[heatmap] Failed to fire timeline fetch event", err));
    }

    return apiSuccess(data);
  },
  { deviceAccess: true }
);
