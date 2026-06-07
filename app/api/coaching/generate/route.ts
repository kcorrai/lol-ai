import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount, assertCanGenerateReport, getPlanLimits } from "@/lib/auth/authorization";
import { buildCoachingInput } from "@/domains/coaching/pipeline/dataPreparator";
import { createPendingReport } from "@/domains/coaching/services/reportService";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { inngest } from "@/inngest/client";
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
  await assertCanGenerateReport(userId);

  // Validate data is ready before creating the DB record
  await buildCoachingInput(riotAccountId, matchIds, focusArea);

  const reportId = await createPendingReport(riotAccountId, matchIds, reportType, focusArea);

  await inngest.send({
    name: "coaching/report.requested",
    data: { reportId, riotAccountId, matchIds, reportType, focusArea },
  });

  await audit({
    userId,
    action: "report.generated",
    resourceId: reportId,
    metadata: { reportType, riotAccountId },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  }).catch(() => { /* non-critical */ });

  return apiSuccess({ reportId, status: "pending" }, 202);
});
