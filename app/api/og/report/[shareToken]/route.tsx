import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getPublicReport } from "@/domains/coaching/services/reportService";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { ReportOgCard } from "./reportOgTemplate";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { shareToken: string } }
): Promise<Response> {
  const rl = await checkRateLimit(`og:${getIp(req)}`, { limit: 60, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  let report: Awaited<ReturnType<typeof getPublicReport>>;
  try {
    report = await getPublicReport(params.shareToken);
  } catch {
    return new Response("Report not found", { status: 404 });
  }

  const image = new ImageResponse(<ReportOgCard report={report} />, { width: 1200, height: 630 });

  const headers = new Headers(image.headers);
  headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");

  return new Response(image.body, { headers, status: image.status });
}
