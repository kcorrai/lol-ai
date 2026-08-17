import { NextRequest, NextResponse } from "next/server";
import { sessionPrep } from "@/domains/marketplace";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

// GET /api/bookings/[bookingId]/prep — the student's own match data, for the
// coach they asked to look at it.
//
// Coach only. The student has all of this on their dashboard already, and a
// second copy of it here would be the thing that made this read as surveillance
// rather than preparation.
export function GET(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
): Promise<NextResponse> {
  return withAuth(async (_r, { userId }): Promise<NextResponse> => {
    const prep = await sessionPrep(params.bookingId, userId);
    if (!prep) throw Errors.notFound("Booking");

    return apiSuccess({ prep });
  })(req);
}
