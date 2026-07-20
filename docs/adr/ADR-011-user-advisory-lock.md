# ADR-011: Per-user Postgres advisory lock for check-then-write quotas

## Status: Accepted

## Context

Two flows read a count and then write based on it, in separate statements with nothing between them:

- `assertCanGenerateReport` (`src/lib/auth/authorization.ts`) counts a user's reports against their
  plan limit; `app/api/coaching/generate/route.ts` then inserts the report.
- `connectAccount` (`src/domains/riot/services/accountService.ts`) counts a user's Riot accounts to
  decide `isPrimary`, then creates the account.

Both are check-then-write races. Concurrent requests read the same pre-write count, all pass, and
all write. For the report quota that means N parallel requests produce N reports on a plan capped at
one per day — and each report is a **paid LLM call**, so the only ceiling on per-user AI spend does
not hold. For `isPrimary` it means a user ends up with two primary accounts, which the rest of the
application assumes is impossible.

CLAUDE.md §2.1 prohibits raw SQL except where genuinely necessary, reviewed and documented. This ADR
is that documentation.

## Decision

Add `withUserLock(userId, fn)` in `src/lib/db/userLock.ts`. It opens a transaction, takes a
Postgres **transaction-scoped advisory lock** keyed on a hash of the user id, and runs the callback
with that transaction's client. Both call sites do their count and their write inside it.

```sql
SELECT pg_advisory_xact_lock($1::bigint)
```

The lock key is derived in JavaScript — `sha256(userId)`, first 8 bytes as a signed 64-bit integer —
rather than with Postgres's `hashtext()`. `hashtext` is an undocumented internal whose output is not
guaranteed stable across major versions, and a key that silently changed would stop excluding
anything without any visible failure.

## Alternatives considered

**A quota counter row with an atomic conditional increment.** More robust in the abstract, and it
would make current usage cheaply readable for the UI. Rejected because the monthly limit is a
**rolling 30-day window**, which a row keyed by period cannot represent. Adopting it would have
converted the limit to a calendar month — letting a free user take 3 reports on July 31 and 3 more
on August 1. That is a product behaviour change, and this was meant to be a bug fix.

**`Serializable` isolation on the transaction.** Avoids raw SQL entirely and lets Postgres detect
the conflict. Rejected because Prisma does not retry the aborted transaction: the losing request
surfaces as `P2034` and needs bespoke retry-or-map handling at every call site, and the isolation
level also invites spurious aborts from unrelated concurrent load.

**A partial unique index** (`isPrimary` true, one per user). Would fix the second case declaratively,
but Prisma cannot express filtered unique indexes in the schema, so it needs hand-written migration
SQL — and it does nothing for the report quota, so the codebase would carry two mechanisms.

## Consequences

- No migration and no schema change; the rolling-window semantics are preserved exactly.
- Contention is per user. Two requests from different users never wait on each other.
- The lock releases when the transaction ends, including on rollback (`_xact_` variant), so a
  thrown callback cannot strand it.
- **Callbacks must stay short.** They hold both an advisory lock and a database connection. In the
  report flow the expensive `buildCoachingInput` deliberately runs *before* the lock is taken. Doing
  slow work inside `withUserLock` would serialize that user's requests for its whole duration — and
  on the serverless pooler, connections are the scarce resource.
- Postgres-specific. It would need replacing if the project ever moved off Postgres, which is not
  planned (ADR-001).
- A single-threaded unit test cannot demonstrate the race is closed, because locked and unlocked
  code behave identically without concurrency. The tests therefore assert the *implementation* — that
  the lock is acquired before the callback, on the same transaction client. Closing the race is
  verified empirically against a real database.
