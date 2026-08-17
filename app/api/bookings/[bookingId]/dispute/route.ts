import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { openDispute } from "@/domains/marketplace";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

const Body = z.object({ reason: z.string().trim().min(20).max(2000) });

// POST /api/bookings/[bookingId]/dispute — the student says it did not happen
// as sold. Only from DELIVERED, and only inside the challenge window.
export function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
): Promise<NextResponse> {
  return withAuth(async (r, { userId }): Promise<NextResponse> => {
    const parsed = Body.safeParse(await r.json().catch(() => null));
    // Twenty characters, because "bad" is not something an admin can decide on.
    if (!parsed.success) throw Errors.validation("Say what went wrong, in a sentence or two.");

    const result = await openDispute(params.bookingId, userId, parsed.data.reason);

    if (!result.ok) {
      switch (result.reason) {
        case "not-found":
        case "forbidden":
          throw Errors.notFound("Booking");
        case "already-open":
          throw Errors.conflict("This session is already being looked at.");
        case "too-late":
          throw Errors.conflict("The window to challenge this session has closed.");
        default:
          throw Errors.conflict("This session cannot be challenged yet.");
      }
    }

    return apiSuccess({ opened: true }, 201);
  })(req);
}
