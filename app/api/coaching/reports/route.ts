import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { listReports } from "@/domains/coaching/services/reportService";

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const riotAccountId = req.nextUrl.searchParams.get("riotAccountId") ?? undefined;
  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
  const result = await listReports(userId, riotAccountId, cursor);
  return apiSuccess(result);
});
