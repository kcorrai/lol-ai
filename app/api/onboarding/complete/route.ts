import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { completeOnboarding } from "@/domains/onboarding/onboardingService";

export const dynamic = "force-dynamic";

// POST /api/onboarding/complete — mark the forced first-journey onboarding done (TASK-217).
export const POST = withAuth(async (_req: NextRequest, { userId }) => {
  const state = await completeOnboarding(userId);
  return apiSuccess({ completedAt: state.completedAt });
});
