import { inngest } from "@/inngest/client";
import { runTimelineCaptureForAccount } from "@/domains/riot/services/timelineCaptureService";

// Durable Inngest worker around `runTimelineCaptureForAccount`, which the sync also reaches
// in-process when Inngest cannot be sent to (LA-66). Same arrangement as the match sync
// worker, and for the same reason: two ways in, one implementation.
export const timelineFetcher = inngest.createFunction(
  {
    id: "timeline-fetcher",
    triggers: [{ event: "timeline/fetch-for-account" }],
    retries: 1,
  },
  async ({ event }: { event: { data: { riotAccountId: string } } }) => {
    return runTimelineCaptureForAccount(event.data.riotAccountId);
  }
);
