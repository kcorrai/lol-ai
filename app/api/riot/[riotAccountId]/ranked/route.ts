import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { getCurrentRank, getLpHistory } from "@/domains/riot";

export const GET = withAuth(
  async (req: NextRequest, { userId }) => {
    const segments = req.nextUrl.pathname.split("/");
    const riotAccountId = segments.at(-2) ?? "";
    if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

    await assertOwnsRiotAccount(userId, riotAccountId);

    const queue = req.nextUrl.searchParams.get("queue");
    const queueType = queue === "flex" ? "RANKED_FLEX_SR" : "RANKED_SOLO_5x5";

    const [rank, lpHistory] = await Promise.all([
      getCurrentRank(riotAccountId, queueType),
      getLpHistory(riotAccountId, 10, queueType),
    ]);

    return apiSuccess({ rank, lpHistory });
  },
  { deviceAccess: true }
);
