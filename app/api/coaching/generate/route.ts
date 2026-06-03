import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount, assertCanGenerateReport } from "@/lib/auth/authorization";
import { buildCoachingInput } from "@/domains/coaching/pipeline/dataPreparator";
import { createPendingReport } from "@/domains/coaching/services/reportService";
import { inngest } from "@/inngest/client";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";

const generateSchema = z.object({
  riotAccountId: z.string().uuid(),
  reportType: z.enum(["session_review", "champion_focus", "climb_roadmap"]),
  matchIds: z.array(z.string().uuid()).min(1).max(10),
  focusArea: z.string().max(50).optional(),
});

const GENERATE_LIMIT = { limit: 10, windowMs: 3_600_000 };

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const rateCheck = await checkRateLimit(`generate:${userId}`, GENERATE_LIMIT);
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

  const reportId = await createPendingReport(riotAccountId, matchIds, reportType);

  // Enqueue via Inngest — durable, retryable, concurrency-capped (5 parallel max).
  // Event ID is scoped to this report so retries are idempotent.
  await inngest.send({
    id: `coaching-${reportId}`,
    name: "coaching/report.requested",
    data: { reportId, riotAccountId, matchIds, reportType, focusArea },
  });

  return apiSuccess({ reportId, status: "pending" }, 202);
});
