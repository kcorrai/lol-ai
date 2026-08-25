import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { generateOrGetRecap } from "@/domains/analysis/services/recapService";

export const dynamic = "force-dynamic";

// POST /api/recap/generate { riotAccountId }
//
// The recap screen opens by calling this, so the window needs it — and it does reach a
// model, for the three-sentence summary. Bounded on four counts before it gets there, which
// is the same standard `/api/coaching/generate` is held to (ADR-038): ownership of the
// account, one stored recap per user per season that every later call reads back rather than
// rebuilding, a seven-day cache on the summary itself keyed by the season's own numbers, and
// ADR-041's budget, which stops calling the model once the month's is spent. A stolen device
// token can ask for the recap the account already had.
export const POST = withAuth(
  async (req: NextRequest, { userId }) => {
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
  },
  { deviceAccess: true }
);
