import { Inngest } from "inngest";
import { logger } from "@/lib/utils/logger";

// Warn loudly if the signing key is missing in production.
// Without it the Inngest SDK falls back to dev mode and accepts all
// incoming requests without signature verification.
if (process.env.NODE_ENV === "production" && !process.env.INNGEST_SIGNING_KEY) {
  logger.warn(
    "[inngest] INNGEST_SIGNING_KEY is not set in production — " +
      "the /api/inngest endpoint will accept unsigned requests. " +
      "Set INNGEST_SIGNING_KEY in your Vercel environment variables."
  );
}

export const inngest = new Inngest({
  id: "lol-ai-coach",
  // INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY are read automatically from env by the SDK
});
