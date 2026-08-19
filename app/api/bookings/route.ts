import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { httpUrl } from "@/lib/security/url";
import { createBooking, listBookings } from "@/domains/marketplace";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { bookingRefusal as refusal } from "@/lib/api/bookingRefusal";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";

export const dynamic = "force-dynamic";

const CreateBody = z.object({
  listingId: z.string().uuid(),
  startTime: z.string().datetime().nullable().default(null),
  studentGoal: z.string().trim().min(10).max(2000),
  studentTimezone: z.string().trim().min(1).max(64),
  riotAccountId: z.string().uuid().nullable().default(null),
  matchIds: z.array(z.string().trim().min(1).max(40)).max(5).default([]),
  vodUrl: httpUrl.nullable().default(null),
});

const ListQuery = z.enum(["student", "coach"]).default("student");

// GET /api/bookings?as= — the caller's own bookings on one side.
export const GET = withAuth(async (req: NextRequest, { userId }): Promise<NextResponse> => {
  const parsed = ListQuery.safeParse(req.nextUrl.searchParams.get("as") ?? undefined);
  if (!parsed.success) throw Errors.validation("Unknown side.");

  return apiSuccess({ bookings: await listBookings(userId, parsed.data) });
});

// POST /api/bookings — request a session.
// Per user, not per IP: a session is already required.
const BOOKING_LIMIT = { limit: 20, windowMs: 3_600_000 };

export const POST = withAuth(async (req: NextRequest, { userId }): Promise<NextResponse> => {
  const rl = await checkRateLimit(`booking:${userId}`, BOOKING_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

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
