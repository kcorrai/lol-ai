import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { getRankUpProbability } from "@/domains/analysis/services/rankUpService";

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const segments = req.nextUrl.pathname.split("/");
  const riotAccountId = segments.at(-2) ?? "";
  if (!riotAccountId) throw Errors.validation("Missing riotAccountId");

  await assertOwnsRiotAccount(userId, riotAccountId);
  const result = await getRankUpProbability(riotAccountId);
  return apiSuccess(result);
});
