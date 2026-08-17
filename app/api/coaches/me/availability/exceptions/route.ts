import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteException,
  getAvailability,
  ownCoachProfileId,
  upsertException,
} from "@/domains/marketplace";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

const ExceptionBody = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isBlocked: z.boolean(),
  startMinute: z.number().int().min(0).max(1439).nullable().default(null),
  endMinute: z.number().int().min(1).max(1440).nullable().default(null),
});

// POST /api/coaches/me/availability/exceptions — a day that does not follow the
// weekly rules. Keyed by date, so saving twice is one row rather than two.
export const POST = withAuth(async (req: NextRequest, { userId }): Promise<NextResponse> => {
  const coachProfileId = await ownCoachProfileId(userId);
  if (!coachProfileId) throw Errors.notFound("Coach profile");

  const parsed = ExceptionBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw Errors.validation(parsed.error.issues[0]?.message ?? "Invalid exception.");
  }

  const result = await upsertException(coachProfileId, parsed.data);
  if (!result.ok) throw Errors.validation(result.detail);

  return apiSuccess(await getAvailability(coachProfileId));
});

// DELETE /api/coaches/me/availability/exceptions?date=YYYY-MM-DD — put the day
// back on the weekly rules.
export const DELETE = withAuth(async (req: NextRequest, { userId }): Promise<NextResponse> => {
  const coachProfileId = await ownCoachProfileId(userId);
  if (!coachProfileId) throw Errors.notFound("Coach profile");

  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Errors.validation("A date is required.");

  await deleteException(coachProfileId, date);
  return apiSuccess(await getAvailability(coachProfileId));
});
