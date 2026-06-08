import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { inngest } from "@/inngest/client";
import { audit } from "@/lib/audit/auditService";

// Export is expensive — limit to 2 per hour
const EXPORT_LIMIT = { limit: 2, windowMs: 3_600_000 };

// Queues an async GDPR export. The Inngest worker builds the ZIP and
// delivers it to the user's email (may take a few minutes for large accounts).
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const rateCheck = await checkRateLimit(`export:${userId}`, EXPORT_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

  await audit({
    userId,
    action: "data.export.requested",
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  await inngest.send({ name: "account/export.requested", data: { userId } });

  return new NextResponse(JSON.stringify({ queued: true }), {
    status: 202,
    headers: { "Content-Type": "application/json" },
  });
});
