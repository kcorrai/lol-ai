import { NextRequest, NextResponse } from "next/server";
import { submitApplication, withdrawApplication } from "@/domains/marketplace";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

// POST /api/coaches/me/apply — put the caller's profile into review.
export const POST = withAuth(async (_req: NextRequest, { userId }): Promise<NextResponse> => {
  const result = await submitApplication(userId);

  if (!result.ok) {
    switch (result.reason) {
      case "no-profile":
        throw Errors.notFound("Coach profile");
      case "suspended":
        throw Errors.forbidden("This profile is suspended.");
      case "already-submitted":
        throw Errors.conflict("This application has already been submitted.");
      case "incomplete":
        // The detail is the one thing still missing, phrased for the applicant.
        throw Errors.validation(result.detail ?? "The profile is not complete yet.");
    }
  }

  return apiSuccess({ submitted: true });
});

// DELETE /api/coaches/me/apply — pull it back out of review.
//
// Only works while nobody has decided. Returning `withdrawn: false` rather than
// a 404 keeps a double-click from looking like a failure.
export const DELETE = withAuth(async (_req: NextRequest, { userId }): Promise<NextResponse> => {
  return apiSuccess({ withdrawn: await withdrawApplication(userId) });
});
