import { NextRequest, NextResponse } from "next/server";
import { spectateStatus } from "@/domains/marketplace";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

// GET /api/bookings/[bookingId]/spectate — is the student in a game right now.
//
// Coach only, live-spectate bookings only. The student does not need the
// platform to tell them whether they are in a game.
export function GET(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
): Promise<NextResponse> {
  return withAuth(async (_r, { userId }): Promise<NextResponse> => {
    const status = await spectateStatus(params.bookingId, userId);
    if (!status) throw Errors.notFound("Booking");

    return apiSuccess({ status });
  })(req);
}
