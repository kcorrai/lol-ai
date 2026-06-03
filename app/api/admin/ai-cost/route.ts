import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/api/withAdminAuth";
import { apiSuccess } from "@/lib/api/response";
import { getAiCostSummary } from "@/domains/admin/services/aiCostService";

export const GET = withAdminAuth(async (_req: NextRequest) => {
  const summary = await getAiCostSummary();
  return apiSuccess(summary);
});
