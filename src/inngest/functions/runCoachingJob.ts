import { inngest } from "@/inngest/client";
import { runCoachingPipeline } from "@/domains/coaching/pipeline/coachingPipeline";
import type { ReportType } from "@prisma/client";

export interface CoachingJobPayload {
  reportId: string;
  riotAccountId: string;
  matchIds: string[];
  reportType: ReportType;
  focusArea?: string;
}

// Durable coaching pipeline — replaces fire-and-forget void call.
// Inngest handles:
//  - Automatic retries (up to 3) on unhandled errors
//  - Global concurrency cap (5 parallel executions prevents OpenAI cost spikes)
//  - Idempotency via event ID (same reportId never runs twice)
export const runCoachingJob = inngest.createFunction(
  {
    id: "run-coaching-pipeline",
    triggers: [{ event: "coaching/report.requested" }],
    concurrency: { limit: 5 },
    retries: 3,
  },
  async ({ event }) => {
    const { reportId, riotAccountId, matchIds, reportType, focusArea } =
      event.data as CoachingJobPayload;

    await runCoachingPipeline(reportId, riotAccountId, matchIds, reportType, focusArea);

    return { reportId, status: "complete" };
  }
);
