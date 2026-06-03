import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { runCoachingJob } from "@/inngest/functions/runCoachingJob";

// Inngest's serve handler registers all functions and handles:
// - Function execution (POST from Inngest servers)
// - Introspection (GET for the Inngest dashboard)
// - PUT for syncing function definitions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runCoachingJob],
});
