import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as market from "@/domains/marketplace";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

const ActionBody = z.discriminatedUnion("action", [
  z.object({ action: z.literal("accept"), meetingUrl: z.string().url().max(500).nullish() }),
  z.object({ action: z.literal("decline"), reason: z.string().trim().min(5).max(1000) }),
  z.object({ action: z.literal("cancel"), reason: z.string().trim().min(5).max(1000) }),
  z.object({ action: z.literal("deliver") }),
  z.object({ action: z.literal("confirm") }),
]);

// GET /api/bookings/[bookingId] — one booking and its whole history.
export function GET(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
): Promise<NextResponse> {
  return withAuth(async (_r, { userId }): Promise<NextResponse> => {
    const booking = await market.getBookingFor(params.bookingId, userId);
    if (!booking) throw Errors.notFound("Booking");

    return apiSuccess({ booking, history: await market.bookingHistory(params.bookingId) });
  })(req);
}

// PATCH /api/bookings/[bookingId] — move it.
export function PATCH(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
): Promise<NextResponse> {
  return withAuth(async (r, { userId }): Promise<NextResponse> => {
    const parsed = ActionBody.safeParse(await r.json().catch(() => null));
    if (!parsed.success) {
      throw Errors.validation(parsed.error.issues[0]?.message ?? "Unknown action.");
    }

    const body = parsed.data;
    const id = params.bookingId;

    const result =
      body.action === "accept"
        ? await market.acceptBooking(id, userId, body.meetingUrl ?? null)
        : body.action === "decline"
          ? await market.declineBooking(id, userId, body.reason)
          : body.action === "cancel"
            ? await market.cancelBooking(id, userId, body.reason)
            : body.action === "deliver"
              ? await market.markDelivered(id, userId)
              : await market.confirmDelivery(id, userId);

    if (!result.ok) throw refusal(result.reason);

    return apiSuccess({ action: body.action });
  })(req);
}

/** Turns a refusal into the response that says what can be done about it. */
function refusal(reason: string) {
  switch (reason) {
    // `not-found` is also what a stranger probing ids gets, so a booking that
    // exists cannot be told apart from one that does not.
    case "not-found":
      return Errors.notFound("Booking");
    case "forbidden":
      return Errors.forbidden("That is not your side of this booking.");
    case "too-late":
      return Errors.conflict("It is too late to cancel this without forfeiting.");
    case "stale":
      return Errors.conflict("This booking has already moved. Reload it.");
    default:
      return Errors.conflict("That cannot be done to this booking now.");
  }
}
