import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount, assertCanGenerateReport, getPlanLimits } from "@/lib/auth/authorization";
import { buildCoachingInput } from "@/domains/coaching/pipeline/dataPreparator";
import { createPendingReport } from "@/domains/coaching/services/reportService";
import { checkRateLimit, rateLimitResponse, addRateLimitHeaders } from "@/lib/api/rateLimit";
import { dispatchOrRunInProcess } from "@/lib/inngest/dispatch";
import { withUserLock } from "@/lib/db/userLock";
import { runCoachingPipeline } from "@/domains/coaching/pipeline/coachingPipeline";
import { audit } from "@/lib/audit/auditService";

const generateSchema = z.object({
  riotAccountId: z.string().uuid(),
  reportType: z.enum(["session_review", "champion_focus", "climb_roadmap"]),
  matchIds: z.array(z.string().uuid()).min(1).max(10),
  focusArea: z.string().max(50).optional(),
});

// Pro users have no plan-level report cap so a tighter hourly guard isn't needed.
// Free users are already capped at 1/day by assertCanGenerateReport.
const FREE_GENERATE_LIMIT = { limit: 5, windowMs: 3_600_000 };
const PRO_GENERATE_LIMIT = { limit: 30, windowMs: 3_600_000 };

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  // Email verification is NOT required to generate a report — only email-*delivery* features gate on
  // it (weekly report emails, activation). Abuse stays bounded by the rate limits + plan caps below
  // (TASK-224).
  const { reportsPerDay } = await getPlanLimits(userId);
  const rateConfig = reportsPerDay === -1 ? PRO_GENERATE_LIMIT : FREE_GENERATE_LIMIT;
  const rateCheck = await checkRateLimit(`generate:${userId}`, rateConfig);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw Errors.validation("Invalid JSON body");
  }

  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);

  const { riotAccountId, reportType, matchIds, focusArea } = parsed.data;

  await assertOwnsRiotAccount(userId, riotAccountId);

  // Cheap advisory check — rejects an over-quota user before the expensive preparation below.
  // Not authoritative: the binding check runs under the lock next to the insert.
  await assertCanGenerateReport(userId);

  // Validate data is ready before creating the DB record. Deliberately outside the lock — it is the
  // slow part, and holding the advisory lock across it would serialize a user's requests for its
  // whole duration.
  await buildCoachingInput(riotAccountId, matchIds, focusArea);

  // Count and insert atomically, so concurrent requests cannot each pass a stale count and every
  // one of them bill an LLM call (TASK-267).
  const reportId = await withUserLock(userId, async (tx) => {
    await assertCanGenerateReport(userId, tx);
    return createPendingReport(riotAccountId, matchIds, reportType, focusArea, tx);
  });

  // Durable via Inngest in production; runs the pipeline in-process if Inngest is unavailable (TASK-223).
  await dispatchOrRunInProcess(
    { name: "coaching/report.requested", data: { reportId, riotAccountId, matchIds, reportType, focusArea } },
    () => runCoachingPipeline(reportId, riotAccountId, matchIds, reportType, focusArea),
  );

  await audit({
    userId,
    action: "report.generated",
    resourceId: reportId,
    metadata: { reportType, riotAccountId },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  }).catch(() => { /* non-critical */ });

  const response = apiSuccess({ reportId, status: "pending" }, 202);
  return addRateLimitHeaders(response, rateCheck, rateConfig.windowMs);
});
