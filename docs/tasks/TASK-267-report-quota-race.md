# TASK-267 — Close the report quota race (and the isPrimary race)

## Status: Done

Supersedes the investigation filed as TASK-255.

## Problem

`assertCanGenerateReport` (`src/lib/auth/authorization.ts:49-83`) counts existing reports and throws
when the count is at the plan limit. The caller inserts the report as a separate statement
(`app/api/coaching/generate/route.ts:53`). No transaction, no lock, no constraint sits between them.

Two requests arriving together both read `count = limit - 1`, both pass, and both insert. On the
free plan (1 report/day) firing N parallel requests yields N reports. **Each report is a paid LLM
call**, so this is the only ceiling on per-user AI spend and it does not hold under concurrency.

The same check-then-write shape exists in `src/domains/riot/services/accountService.ts:69-70`, where
`count() === 0` decides `isPrimary` before the create. Concurrent connects leave a user with two
primary accounts, which the rest of the app assumes cannot happen.

## Approach

A per-user Postgres advisory lock held for the duration of one transaction, in a new
`src/lib/db/userLock.ts` primitive shared by both call sites.

Rejected alternatives:

- **Quota counter table with an atomic increment.** Most robust in principle, but the monthly limit
  is a **rolling 30-day window** (`authorization.ts:54-55`), which a counter row keyed by period
  cannot express. Adopting it would silently convert the limit to a calendar month — a product
  behaviour change (3 reports on Jul 31 plus 3 more on Aug 1), not a bug fix.
- **`Serializable` isolation.** No raw SQL, but Prisma does not retry the aborted transaction; the
  loser surfaces as `P2034` and needs bespoke retry-or-map handling, and the isolation level invites
  spurious aborts under unrelated load.

The advisory lock needs no migration, preserves the rolling-window semantics exactly, requires no
retry handling, and contends only between concurrent requests **from the same user**.

## CLAUDE.md §2.1 exception

This introduces one line of raw SQL (`pg_advisory_xact_lock`). The rule permits it when genuinely
necessary, subject to review and documentation — recorded in **ADR-011**. There is precedent:
`src/domains/counter/services/personalCounterService.ts:48,77` uses parameterised `$queryRaw`.

The lock key is hashed in JS rather than with Postgres's `hashtext`, which is an undocumented
internal.

## Scope

- `src/lib/db/userLock.ts` (new) — `withUserLock`.
- `src/lib/auth/authorization.ts` — `assertCanGenerateReport` takes an optional client so it can run
  inside a transaction. Defaulted, so existing callers and the 26 existing tests are unaffected.
- `src/domains/coaching/services/reportService.ts` — `createPendingReport` takes the same.
- `app/api/coaching/generate/route.ts` — keep the cheap pre-check (fast rejection before the
  expensive `buildCoachingInput`), and move the authoritative check next to the insert, under lock.
- `src/domains/riot/services/accountService.ts` — `connectAccount` count + create under the lock.
- `docs/adr/ADR-011-user-advisory-lock.md` (new).

The expensive data preparation stays **outside** the transaction so the lock is held briefly.

## Honest limit of the tests

A unit test cannot prove the race is closed — single-threaded, the locked and unlocked versions
behave identically. This is the same situation as the `timingSafeEqual` coverage in TASK-263: the
**implementation is the contract**, so the tests assert the implementation (that the lock is taken
before the callback runs, on the same transaction client). Closing the race is verified empirically
against local Postgres, both before and after the fix.

## Acceptance criteria

- [x] `withUserLock` acquires the advisory lock before invoking the callback, on the same `tx` —
      `src/lib/db/userLock.test.ts`, 8 tests.
- [x] `assertCanGenerateReport` actually uses the client it is handed — two cases added to
      `src/lib/auth/authorization.test.ts`.
- [x] Route test via the TASK-262 harness — `app/api/coaching/generate/route.test.ts`, 8 tests.
- [x] Empirical check against local Postgres. **Race reproduced at 10 rows against a limit of 1;
      the locked version produced exactly 1.**
- [x] ADR-011 written. 628 tests pass (up from 610), typecheck and lint clean.

## Empirical verification — and a false negative worth recording

The first run of the concurrency harness reported **PASS for the unfixed code**: ten parallel naive
attempts produced one row. That was not the race failing to exist, it was the harness failing to
expose it — Prisma's connection scheduling happened to serialize the ten attempts, so each count
already saw the previous insert.

Had that run been taken at face value, the conclusion would have been "no race, nothing to fix".
The harness was therefore made to fail first: a 50ms pause between the count and the insert widens
a window that genuinely exists in production (any pool wait or scheduling hiccup between two
unrelated statements), rather than inventing a defect.

```
naive (pre-fix)        10 parallel -> 10 accepted, 10 rows in DB (limit 1)  FAIL
withUserLock (fixed)   10 parallel ->  1 accepted,  1 rows in DB (limit 1)  PASS
```

**A concurrency fix is only verified if the check demonstrably fails without it.** The harness
now exits non-zero when the pre-fix run passes, so it cannot silently degrade into proving nothing.

Script kept out of the repo (scratchpad); reproduce by racing count-then-insert on a free-plan user
with a delay between the two statements.

## Follow-up noticed, not fixed

`app/api/coaching/generate/route.ts` still calls `assertCanGenerateReport` twice — once cheaply and
once authoritatively. That is deliberate (fast rejection before expensive preparation), but it does
mean two extra count queries per accepted request. Worth revisiting only if it shows up in the Neon
egress numbers (TASK-282).
