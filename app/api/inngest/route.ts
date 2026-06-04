import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { runCoachingJob } from "@/inngest/functions/runCoachingJob";
import { autoSessionReview } from "@/inngest/functions/autoSessionReview";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runCoachingJob, autoSessionReview],
});
