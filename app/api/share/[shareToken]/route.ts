import { NextRequest, NextResponse } from "next/server";
import { getPublicReport } from "@/domains/coaching/services/reportService";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { shareToken: string } }
): Promise<NextResponse> {
  const rl = await checkRateLimit(`share-api:${getIp(req)}`, { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  try {
    const report = await getPublicReport(params.shareToken);
    return NextResponse.json({ data: report });
  } catch {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Report not found" } },
      { status: 404 }
    );
  }
}
