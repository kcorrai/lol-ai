# TASK-198: Repair the failing unit test suite

## Status: Done

## Goal
`vitest run` is red: 6 test files fail, 3 tests fail (316 pass). CI is broken,
which violates the "tests are not optional" rule. Get the suite green without
weakening coverage. Three independent root causes, all verified against code.

## Scope

### R1 — PrismaClient construction throws at import (4 files fail to collect)
`src/lib/db/prisma.ts` and `src/lib/db/prismaReadonly.ts` pass
`datasources: { db: { url } }` unconditionally. In the test env neither
`DATABASE_URL` nor a pooler URL is set, so `url` is `undefined` and
`new PrismaClient({ datasources: { db: { url: undefined } } })` throws during
module evaluation. Any test that imports (even transitively) a module that
imports these clients crashes at collection time:
`recapService.test.ts`, `profileService.test.ts`,
`weeklyReportService.test.ts` (pure-function tests) and
`teamService.test.ts` (auto-mock of `teamRepository` loads the real module,
which imports the write client).

Fix: only pass the `datasources` override when a url is actually present
(`url ? { datasources: { db: { url } } } : {}`). In production a url is always
defined, so prod behavior is unchanged; in tests the client constructs lazily
and is never queried (or is mocked).

### R2 — `referralService.test.ts` stale mock
`completeReferral` calls `prisma.referral.count(...)` to enforce the reward cap,
but the test's prisma mock omits `count`. Add `count: vi.fn()` and stub it in the
"awards Pro trial to both parties" test so the referrer is below the cap.

### R3 — `coachingPipeline.test.ts` stale mock
The pipeline was refactored: it persists via `prisma.aiAnalysis.upsert` (not
`create`), and after completing it reads `prisma.coachingReport.findUnique` and
calls posthog `capture`. The test still mocks `aiAnalysis.create` and neither
`findUnique` nor `capture`. Update the mock (`upsert`, `coachingReport.findUnique`,
mock `@/lib/analytics/posthog`) and switch the cache-miss/cache-hit assertions
from `create` to `upsert`.

### R1 fallout — 3 previously-hidden test failures
Once R1 let the four crashing files collect, 33 previously-never-run tests
executed and 3 stale ones surfaced (all test-side, prod code is correct):
- `recapService.test.ts`: expected `YYYY-SN` but `currentSeasonLabel` emits
  `YYYY-SeasonN` (the value keyed into `seasonRecap.userId_seasonLabel`, so the
  function is the contract) → fixed the regex.
- `referralService.test.ts`: `completeReferral` fires `inngest.send`; mocked
  `@/inngest/client`.
- `teamService.test.ts`: `removeMember` reads `prismaReadonly.user.findUnique`,
  absent from the mock → added it.

## Tests
This task fixes tests; success = `vitest run` green.
Result: 43 files / 352 tests pass (was 6 files / 3 tests failing, +33 tests that
never ran before). typecheck + lint clean.

## Commit
`test: repair failing suite — lazy prisma datasource, referral/pipeline mocks`
