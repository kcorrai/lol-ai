# TASK-255 — Report quota is bypassable by concurrent requests (TOCTOU)

Status: **open — not yet implemented**

## Problem
`assertCanGenerateReport` in `src/lib/auth/authorization.ts:49-83` counts existing reports and throws
if the count is at the limit. The caller then inserts the new report as a separate statement:

```ts
const monthCount = await prisma.coachingReport.count({ … });
if (monthCount >= limits.reportsPerMonth) throw Errors.reportLimitReached();
// … later, in the route handler:
await createPendingReport(…)
```

Check and insert are not atomic and share no transaction, lock, or constraint. Two requests that
arrive together both read `count = limit - 1`, both pass, and both insert. On the free plan
(1 report/day) firing N parallel requests yields N reports.

This is not merely a quota nit: each report is a paid LLM call, so the ceiling on AI spend per user
is unenforced.

The same shape exists in `src/domains/riot/services/accountService.ts:70`, where `isPrimary` is
counted before create — concurrent connects can leave two primary accounts.

## Suggested approach
Serialize the check and the insert per user. Options, cheapest first:

1. **Conditional insert in a transaction.** Wrap count + create in `prisma.$transaction` at
   `Serializable` isolation and let the DB reject the loser. Smallest change; Prisma retries are the
   caller's problem.
2. **A quota counter row with an atomic increment.** A `reportQuota` row per (userId, day) with a
   `CHECK` or a conditional `updateMany` that only increments when below the limit; insert the report
   only if the update affected a row. Most robust, needs a migration.
3. **Advisory lock** keyed on the user id for the duration of the check-and-insert.

Recommend (2) — it also makes the current usage cheaply readable for the UI, which today re-counts.

## Tests to add
Concurrent-call test asserting exactly `limit` reports are created when `limit + 5` requests race;
plus the existing single-request limit behaviour.

refs TASK-255
