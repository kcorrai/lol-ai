import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { assertOwnsRiotAccount, assertCanGenerateReport } from "@/lib/auth/authorization";
import { buildCoachingInput } from "@/domains/coaching/pipeline/dataPreparator";
import { createPendingReport } from "@/domains/coaching/services/reportService";
import { runCoachingPipeline } from "@/domains/coaching/pipeline/coachingPipeline";

const generateSchema = z.object({
  riotAccountId: z.string().uuid(),
  reportType: z.enum(["session_review", "champion_focus", "climb_roadmap"]),
  matchIds: z.array(z.string().uuid()).min(1).max(10),
  focusArea: z.string().max(50).optional(),
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
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

  // Validate the data is ready (will throw if insufficient match data)
  await buildCoachingInput(riotAccountId, matchIds, focusArea);

  const reportId = await createPendingReport(riotAccountId, matchIds, reportType);

  // Fire-and-forget: pipeline updates the report to "complete"/"failed" async.
  // In production this should move to a proper job queue (BullMQ/Redis).
  void runCoachingPipeline(reportId, riotAccountId, matchIds, reportType, focusArea);

  return apiSuccess({ reportId, status: "pending" }, 202);
});
