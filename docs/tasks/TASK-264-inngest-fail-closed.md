# TASK-264 — Make the Inngest endpoint fail closed

Scored **78/100**.

## Problem

`src/inngest/client.ts` logged a warning when `INNGEST_SIGNING_KEY` was missing in production, then
carried on:

```ts
if (process.env.NODE_ENV === "production" && !process.env.INNGEST_SIGNING_KEY) {
  logger.warn("[inngest] INNGEST_SIGNING_KEY is not set in production — …");
}
```

Without the key the Inngest SDK falls back to dev mode and accepts every request unverified.
`/api/inngest` serves **26 functions**, including `gdprErasure`, `gdprExport`, `planRenewalWorker`,
`referralReward`, and every transactional email sender. One missing Vercel environment variable
silently published all of that to the internet, and the only signal was a log line nobody reads.

## Change

The guard now throws at module load, so a misconfigured deployment fails on its first cold start
instead of serving an open endpoint. A broken deploy is recoverable; an unauthenticated
GDPR-erasure endpoint is not.

## Why the build phase is exempt

Throwing unconditionally on `NODE_ENV === "production"` would have broken `next build`, which also
runs with `NODE_ENV=production` — and 35 files import this module, so the build evaluates it.

That would be the wrong trade: a build serves no requests, and the signing key is legitimately absent
from build environments. **Verified concretely in this repo:** `.env.local` has `INNGEST_EVENT_KEY`
but no `INNGEST_SIGNING_KEY`, so an unconditional throw would have started failing `npm run build`
locally and on any deploy that does not expose the key at build time.

So the guard skips `NEXT_PHASE === "phase-production-build"`. That constant is not a guess — Next
assigns it at `node_modules/next/dist/build/index.js:1054` from `PHASE_PRODUCTION_BUILD` in
`shared/lib/constants.js:294`.

## ⚠️ Deployment prerequisite

**`INNGEST_SIGNING_KEY` must be set in the Vercel production environment before this ships.** It is
absent from `.env.local`. If it is also absent in Vercel, the first request after deploy will throw —
which is the intended behaviour, and is the correct reading of the situation: it means the endpoint
was already accepting unsigned requests and the app was relying on obscurity.

It is documented in `.env.example:126`.

## Tests

`src/inngest/client.test.ts` — 6 tests. The guard is a module-load side effect, so each case runs
`vi.resetModules()` then a dynamic `import()`; re-reading env against an already-loaded module would
not re-run it. Covers: production without a key throws; production with a key loads; `development`
and `test` load without a key; the build phase is exempt; and — the one that matters for the
exemption — a runtime load still throws after a keyless build.

The `inngest` mock is a `class`, not `vi.fn().mockImplementation(() => …)`: the module calls
`new Inngest(...)` and an arrow function is not newable.

## Verification

`npx vitest run src/inngest/client.test.ts` — 6 passed. Full suite green, `tsc` and ESLint clean.

**Not run:** a full `next build`. Dev servers were listening on ports 3000 and 3001 during this work
and they share the `.next` directory, which produces spurious `Cannot find module './NNNN.js'`
failures. The build-phase exemption is covered by unit test and by the Next source above; a real
`next build` on a clean tree is still worth doing before deploy.

refs TASK-264
