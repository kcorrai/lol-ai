import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import { getActivePlan, generatePlan } from "@/domains/analysis/services/improvementPlanService";

function extractId(req: NextRequest): string {
  const id = req.nextUrl.pathname.split("/").at(-2) ?? "";
  if (!id) throw Errors.validation("Missing riotAccountId");
  return id;
}

// GET /api/riot/[riotAccountId]/plan
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const riotAccountId = extractId(req);
  await assertOwnsRiotAccount(userId, riotAccountId);
  const plan = await getActivePlan(riotAccountId);
  return apiSuccess(plan);
});

// POST /api/riot/[riotAccountId]/plan
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const riotAccountId = extractId(req);
  await assertOwnsRiotAccount(userId, riotAccountId);
  const plan = await generatePlan(riotAccountId);
  return apiSuccess(plan);
});
