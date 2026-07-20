import { Inngest } from "inngest";

// Fail closed. Without a signing key the Inngest SDK falls back to dev mode and
// accepts every request to /api/inngest unauthenticated — an endpoint that
// serves 26 functions including GDPR erasure, email dispatch and subscription
// renewal. This used to log a warning and continue, which meant one missing
// Vercel env var silently published all of that to the internet.
//
// Throwing at module load means a misconfigured deployment fails on its first
// cold start rather than serving an open endpoint. A broken deploy is
// recoverable; an unauthenticated GDPR-erasure endpoint is not.
//
// `next build` also runs with NODE_ENV=production but serves no requests, and
// the key is legitimately absent from build environments — so the guard is
// skipped during the build phase, or it would turn a runtime concern into a
// build failure.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

if (
  process.env.NODE_ENV === "production" &&
  !isBuildPhase &&
  !process.env.INNGEST_SIGNING_KEY
) {
  throw new Error(
    "[inngest] INNGEST_SIGNING_KEY is required in production — without it " +
      "/api/inngest accepts unsigned requests. Set it in the Vercel environment."
  );
}

export const inngest = new Inngest({
  id: "lol-ai-coach",
  // INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY are read automatically from env by the SDK
});
