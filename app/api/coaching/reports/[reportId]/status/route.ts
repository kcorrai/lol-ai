import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { getReportStatus } from "@/domains/coaching/services/reportService";
import { Errors } from "@/lib/api/errors";

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const reportId = req.nextUrl.pathname.split("/").at(-2) ?? "";
  if (!reportId) throw Errors.validation("Missing reportId");

  const report = await getReportStatus(reportId, userId);
  return apiSuccess({ id: report.id, status: report.status });
});
