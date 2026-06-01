import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { getReport } from "@/domains/coaching/services/reportService";

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const reportId = req.nextUrl.pathname.split("/").at(-1) ?? "";
  const report = await getReport(reportId, userId);
  return apiSuccess(report);
});
