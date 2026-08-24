import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { getPatchImpact } from "@/domains/analysis/services/patchService";

export const dynamic = "force-dynamic";

// GET /api/patch/impact?riotAccountId=<uuid>
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const riotAccountId = req.nextUrl.searchParams.get("riotAccountId");
  if (!riotAccountId) throw Errors.validation("riotAccountId is required");

  await assertOwnsRiotAccount(userId, riotAccountId);
  const impact = await getPatchImpact(riotAccountId);
  return apiSuccess(impact);
}, { deviceAccess: true });
