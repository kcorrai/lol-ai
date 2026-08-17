import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { getProgress } from "@/domains/quiz/services/streakService";

// Streak and today's record for a signed-in player. Anonymous visitors play the
// whole quiz without this — they get a 401 here and keep their board in
// localStorage, which is the point: the account buys persistence, not access.
//
// Read-only. Results are written by /api/quiz/guess as each guess is judged, so
// there is no endpoint a client can use to assert a score it did not earn.

export const GET = withAuth(async (_req: NextRequest, ctx) =>
  apiSuccess(await getProgress(ctx.userId, new Date()))
);
