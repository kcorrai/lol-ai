import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRank, coachBadgeAndAccounts } from "@/domains/marketplace";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

const RankBody = z.object({
  riotAccountId: z.string().uuid(),
});

// GET /api/coaches/me/rank — the caller's badge, and the accounts they could
// check it against. One request, because the picker is useless without the
// current state beside it.
export const GET = withAuth(async (_req: NextRequest, { userId }): Promise<NextResponse> => {
  return apiSuccess(await coachBadgeAndAccounts(userId));
});

// POST /api/coaches/me/rank — read the rank off one of the caller's linked
// accounts and record it as their badge.
//
// The coach picks the account; they cannot supply a rank. That asymmetry is the
// whole feature — every competitor lets the coach type the number.
export const POST = withAuth(async (req: NextRequest, { userId }): Promise<NextResponse> => {
  const parsed = RankBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw Errors.validation("A linked Riot account is required.");

  const result = await checkRank(userId, parsed.data.riotAccountId);

  if (!result.ok) {
    switch (result.reason) {
      case "no-profile":
        throw Errors.notFound("Coach profile");
      case "not-owned":
        throw Errors.riotAccountNotOwned();
      case "no-rank":
        // Not an error in the account — we simply hold no ranked snapshot for
        // it yet, which a sync fixes.
        throw Errors.conflict(
          "No ranked games have been synced for that account yet. Sync it, then try again."
        );
    }
  }

  return apiSuccess({ badge: result.badge });
});
