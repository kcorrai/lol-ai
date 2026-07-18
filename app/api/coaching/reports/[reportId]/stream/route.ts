import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import {
  SSE_HEADERS,
  terminalStatusBody,
  createReportStatusStream,
} from "@/domains/coaching/services/reportStatusStream";

export async function GET(
  req: NextRequest,
  { params }: { params: { reportId: string } }
): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { reportId } = params;

  // Verify the report belongs to this user before streaming
  const report = await prisma.coachingReport.findFirst({
    where: { id: reportId, riotAccount: { userId: session.user.id } },
    select: { id: true, status: true },
  });

  if (!report) return new Response("Not found", { status: 404 });

  // If already terminal, return immediately with a single event
  if (report.status === "complete" || report.status === "failed") {
    return new Response(terminalStatusBody(report.status), { headers: SSE_HEADERS });
  }

  return new Response(createReportStatusStream(reportId, req.signal), { headers: SSE_HEADERS });
}
