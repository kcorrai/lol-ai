import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { getCurrentRank, getLpHistory } from "@/domains/riot";

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const segments = req.nextUrl.pathname.split("/");
  const riotAccountId = segments.at(-2) ?? "";
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  await assertOwnsRiotAccount(userId, riotAccountId);

  const [rank, lpHistory] = await Promise.all([
    getCurrentRank(riotAccountId),
    getLpHistory(riotAccountId, 10),
  ]);

  return apiSuccess({ rank, lpHistory });
});
