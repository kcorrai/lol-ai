import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { goalProgress, setGoals, MAX_GOALS } from "@/domains/marketplace";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

const GoalsBody = z.object({
  goals: z
    .array(
      z.object({
        metric: z.enum(["CS_PER_MIN", "DEATHS", "VISION_PER_MIN", "KDA"]),
        target: z.number().finite(),
      })
    )
    .max(MAX_GOALS),
});

// GET /api/bookings/[bookingId]/goals — the session's goals and the student's games against them.
export function GET(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
): Promise<NextResponse> {
  return withAuth(async (_r, { userId }): Promise<NextResponse> => {
    const progress = await goalProgress(params.bookingId, userId);
    if (!progress) throw Errors.notFound("Booking");
    return apiSuccess(progress);
  })(req);
}

// PUT /api/bookings/[bookingId]/goals — the coach replaces the session's goals.
export function PUT(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
): Promise<NextResponse> {
  return withAuth(async (r, { userId }): Promise<NextResponse> => {
    const parsed = GoalsBody.safeParse(await r.json().catch(() => null));
    if (!parsed.success) throw Errors.validation("Up to three goals, each a metric and a number.");

    const result = await setGoals(params.bookingId, userId, parsed.data.goals);
    if (!result.ok) {
      if (result.reason === "not-found") throw Errors.notFound("Booking");
      if (result.reason === "not-open") {
        throw Errors.conflict("Goals can be set once the session has been accepted.");
      }
      throw Errors.validation("Each goal needs a different metric and a realistic target.");
    }
    return apiSuccess({ ok: true });
  })(req);
}
