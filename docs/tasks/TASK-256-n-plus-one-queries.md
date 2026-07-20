# TASK-256 — N+1 queries in habit detection and weekly email

Status: **open — not yet implemented**

## Problem
CLAUDE.md §10 forbids N+1 queries. Two confirmed violations:

### 1. `src/domains/analysis/services/habitDetectionService.ts:119-147`
```ts
for (const c of candidates) {
  const existing = await prisma.playerHabit.findFirst({
    where: { riotAccountId, habitType: c.habitType, isResolved: false },
  });
  if (existing) { await prisma.playerHabit.update({ … }); }
  else { await prisma.playerHabit.create({ … }); }
}
```
One `findFirst` **plus** one write per candidate — 3 round trips per habit, serially awaited.

Fix: one `findMany({ where: { riotAccountId, isResolved: false } })` before the loop into a
`Map<habitType, habit>`, then branch off the map. Better still, add a unique constraint on
`(riotAccountId, habitType, isResolved)` and collapse the whole body to a single `upsert`.

### 2. `src/inngest/functions/sendWeeklyReportEmails.ts:66-104`
```ts
for (const integration of integrations) {
  const weekAgoRank = await prisma.rankedHistory.findFirst({
    where: { riotAccountId: account.id, … },
  });
}
```
One query per subscriber, inside a weekly job that fans out over every opted-in user — the cost
grows linearly with the mailing list and is paid on every retry.

Fix: batch-fetch with `riotAccountId: { in: [...] }` before the loop and index into a Map.

The same file also over-selects at lines 33-64: it pulls whole `MatchParticipant` rows through a
nested include when only `won` is read.

## Tests to add
Service-level tests asserting the batched implementations issue a constant number of queries
regardless of input size (assert on the mocked Prisma call count).

refs TASK-256
