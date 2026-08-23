import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOwnProfile, saveOwnProfile, setAcceptingStudents } from "@/domains/marketplace";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

const AcceptingBody = z.object({ acceptingStudents: z.boolean() });

const ProfileBody = z.object({
  displayName: z.string().trim().min(2).max(48),
  headline: z.string().trim().min(4).max(120),
  bio: z.string().trim().min(1).max(4000),
  languages: z.array(z.string().trim().length(2)).min(1).max(8),
  regions: z.array(z.string().trim().min(2).max(8)).min(1).max(8),
  roles: z
    .array(z.enum(["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]))
    .min(1)
    .max(5),
  championIds: z.array(z.number().int().positive()).max(30).default([]),
  timezone: z.string().trim().min(1).max(64),
});

// GET /api/coaches/me — the caller's own coach profile, or null if they have
// never started one. Not a 404: "you are not a coach yet" is the answer the
// application page is asking for, not a missing resource.
export const GET = withAuth(async (_req: NextRequest, { userId }): Promise<NextResponse> => {
  return apiSuccess({ profile: await getOwnProfile(userId) });
});

// PUT /api/coaches/me — create or update it.
export const PUT = withAuth(async (req: NextRequest, { userId }): Promise<NextResponse> => {
  const parsed = ProfileBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw Errors.validation(parsed.error.issues[0]?.message ?? "Invalid profile.");
  }

  const result = await saveOwnProfile(userId, parsed.data);

  // A profile that can be edited under a reviewer is one where what gets
  // approved is not what was read.
  if (!result.ok) {
    throw Errors.conflict("This profile cannot be edited while it is under review.");
  }

  return apiSuccess({ profile: result.profile });
});

// PATCH /api/coaches/me — the coach's own "taking students" switch.
//
// Separate from PUT because it is a different decision with a different rule:
// a profile is frozen while a reviewer is reading it, but going on holiday is
// something an approved coach must be able to do at any moment.
export const PATCH = withAuth(async (req: NextRequest, { userId }): Promise<NextResponse> => {
  const parsed = AcceptingBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw Errors.validation("Expected acceptingStudents to be true or false.");

  if (!(await setAcceptingStudents(userId, parsed.data.acceptingStudents))) {
    throw Errors.conflict("Only an approved coach can open or close their books.");
  }

  return apiSuccess({ profile: await getOwnProfile(userId) });
});
