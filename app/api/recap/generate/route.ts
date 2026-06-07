import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { generateOrGetRecap } from "@/domains/analysis/services/recapService";

export const dynamic = "force-dynamic";

// POST /api/recap/generate { riotAccountId }
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  let body: { riotAccountId?: string };
  try {
    body = (await req.json()) as { riotAccountId?: string };
  } catch {
    throw Errors.validation("Invalid JSON body");
  }

  const { riotAccountId } = body;
  if (!riotAccountId) throw Errors.validation("riotAccountId is required");

  await assertOwnsRiotAccount(userId, riotAccountId);

  const recap = await generateOrGetRecap(userId, riotAccountId);
  return apiSuccess(recap);
});
