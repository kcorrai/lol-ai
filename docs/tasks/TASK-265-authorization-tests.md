# TASK-265 — Test `authorization.ts`

Scored **85/100**.

## Problem
`src/lib/auth/authorization.ts` was at 0% coverage. Every IDOR defence and every paywall in the app
routes through its five exported functions — `assertOwnsRiotAccount`, `assertCanAddRiotAccount`,
`assertCanDisconnectRiotAccount`, `assertCanGenerateReport`, `checkIsPro`.

The audit confirmed the *call sites* apply them consistently across the API surface. The functions
themselves had nothing verifying they do what their names claim.

## Change
New `src/lib/auth/authorization.test.ts` — 26 tests, no production code changed. Prisma is mocked;
`getPlanLimits` (`src/lib/auth/planLimits.ts`) is driven through the mocked `subscription.findUnique`
rather than being stubbed, so the plan → limits mapping is exercised too.

## What the tests pin down
- **`assertOwnsRiotAccount`** — owns / does not own, plus an assertion that the lookup is **scoped by
  `userId` in the WHERE clause**. That last one matters: fetching by id and comparing afterwards is
  the classic way this defence gets rewritten into a no-op, and it would still pass the first two.
- **`assertCanAddRiotAccount`** — the limit boundary on free (1), pro (3) and elite (5), and that the
  last slot below the limit is allowed.
- **`assertCanDisconnectRiotAccount`** — free is locked (the deliberate anti-scraping rule: with one
  allowed account, disconnect/reconnect cycling would let a single seat enumerate accounts), pro,
  elite and team are not.
- **`checkIsPro`** — eight plan × status combinations. `trialing` counts as active; `canceled`,
  `past_due` and `unpaid` do not; a missing subscription row is free.
- **`assertCanGenerateReport`** — below both caps; at the monthly cap of 3; at the daily cap of 1
  *while the month is not exhausted* (the daily cap exists precisely so a free user cannot burn the
  monthly quota in one sitting); paid plans uncapped **and skipping the count queries entirely**
  (`-1` means unlimited, and a naive `count >= limit` would reject every paying user); and that the
  count is scoped to the user's own accounts with `status: { in: ["complete", "pending"] }`.

## A test-isolation bug found while writing this
The first run failed one test for a non-obvious reason worth recording: `vi.clearAllMocks()` clears
recorded calls but **not** pending `mockResolvedValueOnce` values. A test that throws on the monthly
check never consumes its queued daily value, so the leftover shifts every subsequent test's reads by
one — results became dependent on declaration order.

Fixed by resetting inside the `counts()` helper. Verified order-independent with
`npx vitest run … --sequence.shuffle`.

This is worth remembering for the other Prisma-mocking suites in the repo, which use the same
`clearAllMocks` + `mockResolvedValueOnce` combination.

## Note — not fixed here
`assertCanGenerateReport` remains a check-then-insert with no transaction; the quota is still
bypassable under concurrency. These tests document the intended single-request behaviour so the
TASK-267 fix has a baseline to preserve.

## Verification
`npx vitest run src/lib/auth/authorization.test.ts` — 26 passed, and again under `--sequence.shuffle`.
Full suite green; `tsc --noEmit` and ESLint clean.

refs TASK-265
