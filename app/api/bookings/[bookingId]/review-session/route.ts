import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { leaveReview } from "@/domains/marketplace";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

const Body = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(2000).nullish(),
});

// POST /api/bookings/[bookingId]/review-session — one side's review.
//
// Named apart from `/review`, which is the async deliverable. Both sides write
// here; neither sees the other's until both have, or the window closes.
export function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
): Promise<NextResponse> {
  return withAuth(async (r, { userId }): Promise<NextResponse> => {
    const parsed = Body.safeParse(await r.json().catch(() => null));
    if (!parsed.success) throw Errors.validation("A rating from 1 to 5 is required.");

    const result = await leaveReview(
      params.bookingId,
      userId,
      parsed.data.rating,
      parsed.data.body ?? null
    );

    if (!result.ok) {
      switch (result.reason) {
        case "not-found":
          throw Errors.notFound("Booking");
        case "not-complete":
          // Verified purchase by construction: no completed session, no review.
          throw Errors.conflict("You can review this once the session has completed.");
        case "already-reviewed":
          throw Errors.conflict("You have already reviewed this session.");
        default:
          throw Errors.validation("That review is not valid.");
      }
    }

    return apiSuccess({ revealed: result.revealed }, 201);
  })(req);
}
