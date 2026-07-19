import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { resetOnboarding } from "@/domains/onboarding/onboardingService";

export const dynamic = "force-dynamic";

// POST /api/onboarding/reset — DEV ONLY. Clears the current user's forced first-journey flag so the
// guided tour can be replayed. Guarded out of production (TASK-226).
export const POST = withAuth(async (_req: NextRequest, { userId }) => {
  if (process.env.NODE_ENV === "production") throw Errors.notFound("Route");
  await resetOnboarding(userId);
  return apiSuccess({ reset: true });
});
