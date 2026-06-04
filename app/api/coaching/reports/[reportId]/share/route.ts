import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { generateShareToken } from "@/domains/coaching/services/reportService";

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const rl = await checkRateLimit(`share-gen:${userId}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  // Next.js App Router doesn't pass dynamic params to withAuth handlers —
  // extract reportId from the URL path directly.
  const segments = req.nextUrl.pathname.split("/");
  const reportId = segments.at(-2) ?? "";
  if (!reportId) throw Errors.validation("Missing reportId");

  const token = await generateShareToken(reportId, userId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
  const shareUrl = `${appUrl}/share/report/${token}`;

  return apiSuccess({ shareToken: token, shareUrl });
});
