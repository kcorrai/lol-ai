import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { getOnboardingState } from "@/domains/onboarding/onboardingService";

export const dynamic = "force-dynamic";

// GET /api/onboarding/state — whether the forced first-journey is complete for the current user.
// Used to gate the guide overlay on the public profile page, which can't SSR-gate per viewer (TASK-225).
export const GET = withAuth(async (_req: NextRequest, { userId }) => {
  const state = await getOnboardingState(userId);
  return apiSuccess({ completed: state.completed });
});
