import { NextRequest, NextResponse } from "next/server";
import { unfollowTeam } from "@/domains/esports";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";

export const dynamic = "force-dynamic";

// DELETE /api/esports/follows/[teamId] — unfollow.
//
// Keyed by team id rather than slug, so a reader can undo a follow whose team
// has since dropped out of the feed. A slug lookup would make exactly that case
// impossible, which is the one case where being stuck matters.
export function DELETE(
  req: NextRequest,
  { params }: { params: { teamId: string } }
): Promise<NextResponse> {
  return withAuth(async (_r, { userId }): Promise<NextResponse> => {
    // Deleting something already gone is not an error — the reader wanted it
    // gone and it is gone. `removed` says which of the two happened.
    return apiSuccess({ removed: await unfollowTeam(userId, params.teamId) });
  })(req);
}
