import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createBooking, listBookings } from "@/domains/marketplace";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

const CreateBody = z.object({
  listingId: z.string().uuid(),
  startTime: z.string().datetime().nullable().default(null),
  studentGoal: z.string().trim().min(10).max(2000),
  studentTimezone: z.string().trim().min(1).max(64),
  riotAccountId: z.string().uuid().nullable().default(null),
  matchIds: z.array(z.string().trim().min(1).max(40)).max(5).default([]),
  vodUrl: z.string().url().max(500).nullable().default(null),
});

const ListQuery = z.enum(["student", "coach"]).default("student");

// GET /api/bookings?as=student|coach — the caller's own bookings on one side.
export const GET = withAuth(async (req: NextRequest, { userId }): Promise<NextResponse> => {
  const parsed = ListQuery.safeParse(req.nextUrl.searchParams.get("as") ?? undefined);
  if (!parsed.success) throw Errors.validation("Unknown side.");

  return apiSuccess({ bookings: await listBookings(userId, parsed.data) });
});

// POST /api/bookings — request a session.
export const POST = withAuth(async (req: NextRequest, { userId }): Promise<NextResponse> => {
  const parsed = CreateBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw Errors.validation(parsed.error.issues[0]?.message ?? "Invalid booking.");
  }

  const result = await createBooking({
    studentId: userId,
    listingId: parsed.data.listingId,
    startTime: parsed.data.startTime ? new Date(parsed.data.startTime) : null,
    studentGoal: parsed.data.studentGoal,
    studentTimezone: parsed.data.studentTimezone,
    riotAccountId: parsed.data.riotAccountId,
    matchIds: parsed.data.matchIds,
    vodUrl: parsed.data.vodUrl,
  });

  if (!result.ok) throw refusal(result.reason);

  return apiSuccess({ bookingId: result.bookingId }, 201);
});

/** Turns a refusal into the response that says what the student can do about it. */
function refusal(reason: string) {
  switch (reason) {
    case "listing-not-found":
      return Errors.notFound("Listing");
    case "not-accepting":
      return Errors.conflict("This coach is not taking new students right now.");
    case "self-booking":
      return Errors.forbidden("You cannot book your own session.");
    case "slot-required":
      return Errors.validation("Pick a time for this session.");
    case "slot-taken":
      // Somebody took it between the page loading and this request. A 409 so
      // the client knows to refresh the slots rather than retrying blindly.
      return Errors.conflict("That time has just been taken. Pick another.");
    case "material-required":
      return Errors.validation("Add a match or a video link for the coach to review.");
    case "account-not-owned":
      return Errors.riotAccountNotOwned();
    default:
      return Errors.validation("That booking could not be made.");
  }
}
