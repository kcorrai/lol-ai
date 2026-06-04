import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { getCounterStats } from "@/domains/champions/services/counterPickService";

// GET /api/riot/[riotAccountId]/counters?champion=Yasuo
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const segments = req.nextUrl.pathname.split("/");
  const riotAccountId = segments.at(-2) ?? "";
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  const champion = req.nextUrl.searchParams.get("champion");
  if (!champion) throw Errors.validation("Missing champion query param");

  await assertOwnsRiotAccount(userId, riotAccountId);

  const stats = await getCounterStats(riotAccountId, champion);
  return apiSuccess(stats);
});
