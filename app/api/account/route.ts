import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { mergeProfileSettings } from "@/lib/db/profileSettingsStore";
import { audit } from "@/lib/audit/auditService";
import { inngest } from "@/inngest/client";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";

// Account deletion is irreversible — strict rate limit
const DELETE_LIMIT = { limit: 3, windowMs: 3_600_000 };

// Initiates a GDPR erasure: marks the user for deletion.
// An Inngest scheduled worker performs the hard delete after 30 days.
export const DELETE = withAuth(async (req: NextRequest, { userId, userEmail }) => {
  const rateCheck = await checkRateLimit(`account-delete:${userId}`, DELETE_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

  // Record audit BEFORE marking deletion so audit log row is associated with userId
  await audit({
    userId,
    action: "data.deletion.requested",
    metadata: { email: userEmail },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  const deletionScheduledAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Merged into the settings blob rather than assigned over it. Assigning wiped the
  // user's public-profile visibility toggles, whose defaults are *shown* — so asking
  // to be deleted quietly made the account more public than it was.
  await mergeProfileSettings(userId, {
    deletionScheduledAt: deletionScheduledAt.toISOString(),
    deletionRequestedAt: new Date().toISOString(),
  });

  // Schedule hard delete via Inngest
  await inngest.send({
    name: "account/deletion.scheduled",
    data: { userId, deletionScheduledAt: deletionScheduledAt.toISOString() },
    ts: deletionScheduledAt.getTime(),
  });

  return apiSuccess({ deletionScheduledAt: deletionScheduledAt.toISOString() });
});
