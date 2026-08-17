import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAvailability, replaceRules, ownCoachProfileId } from "@/domains/marketplace";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

const RulesBody = z.object({
  rules: z
    .array(
      z.object({
        days: z.array(z.number().int().min(0).max(6)).min(1).max(7),
        startMinute: z.number().int().min(0).max(1439),
        endMinute: z.number().int().min(1).max(1440),
      })
    )
    .max(20),
});

// GET /api/coaches/me/availability — the caller's weekly hours and exceptions.
export const GET = withAuth(async (_req: NextRequest, { userId }): Promise<NextResponse> => {
  const coachProfileId = await ownCoachProfileId(userId);
  if (!coachProfileId) throw Errors.notFound("Coach profile");

  return apiSuccess(await getAvailability(coachProfileId));
});

// PUT /api/coaches/me/availability — replace the whole weekly schedule.
//
// Replaced rather than patched: a schedule is read as a set, and a partial
// update leaves behind a window nobody meant to keep.
export const PUT = withAuth(async (req: NextRequest, { userId }): Promise<NextResponse> => {
  const coachProfileId = await ownCoachProfileId(userId);
  if (!coachProfileId) throw Errors.notFound("Coach profile");

  const parsed = RulesBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw Errors.validation(parsed.error.issues[0]?.message ?? "Invalid schedule.");
  }

  const result = await replaceRules(coachProfileId, parsed.data.rules);
  if (!result.ok) throw Errors.validation(result.detail);

  return apiSuccess(await getAvailability(coachProfileId));
});
