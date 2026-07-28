# TASK-293: Move the AI cache off Neon and onto Redis

## Status: Done

## Context

`ai_cache` is **2984 kB of a 3.9 MB database — about 76% of it** (measured
2026-07-28, TASK-292). Every byte of it is regenerable: it is a cache, sitting in
the primary transactional database, on a plan billed by network transfer.

TASK-282 and TASK-292 reduced how _often_ those rows are read. Neither addressed
the more basic point that they should not be in Postgres at all. After TASK-292
the hot path is `memo → Next Data Cache → Neon`; this task replaces the last hop
for genuine cache entries, so a cold shared cache refills from Redis instead of
from the database.

`@upstash/redis` is already a dependency and already configured
(`KV_REST_API_URL` / `KV_REST_API_TOKEN`), used today for rate limiting and
brute-force counters. Credentials were verified working from this machine before
any code was written — a set + get round trip in 691 ms.

Two facts make the swap safe, both checked rather than assumed:

- **`aiCache.ts` is a real seam.** There is no `prisma.aiCache` usage anywhere
  outside it — not in services, routes, scripts or the admin analytics. The five
  exported functions are the entire surface, and 14 consumer files touch nothing
  else.
- **`incrementHit` has no production callers.** Only its own test imports it. It
  survived TASK-282 as "for callers that genuinely want the telemetry"; there are
  none.

## Decision

Route by TTL, because the rows are not all the same kind of thing.

| TTL        | what it is                 | where it goes |
| ---------- | -------------------------- | ------------- |
| < 90 days  | cache — regenerable, hot   | **Redis**     |
| >= 90 days | durability fallback — cold | Postgres      |

Every TTL in the codebase is 0.042, 0.25, 0.5, 1, 7, 14 or 30 days except one:
`SNAPSHOT_TTL_DAYS = 365`, commented "effectively permanent fallback". Those are
the `:last-good` entries, and they are not a cache. They exist to be read
_precisely when op.gg is down_, which is the one moment their absence would be
felt. Redis evicts under memory pressure; Postgres does not. Losing a last-good
snapshot to eviction would break the outage it was written for, so it stays.

This costs nothing: last-good is written twice a day and read only during a feed
outage, so it contributes no meaningful steady-state transfer.

Reads try Redis first and fall back to Postgres, which also means entries written
before this change keep working with no migration and no backfill.

**Redis failures never surface.** A read error is a miss, a write error is
dropped. Losing a cache write must not fail a request — the same reasoning as
TASK-285, which wrapped the preview cache write after an outage turned a
completed payload into a 500.

## Scope

- `src/lib/cache/redisCache.ts` — new; a small failure-tolerant get/set/delete
  over Upstash, with the configuration check.
- `src/lib/ai/aiCache.ts` — routing only; the five signatures do not change, so
  the 14 consumers are untouched.
- Tests for both.

Out of scope: removing the now-confirmed-dead `incrementHit`, and the `hitCount`
column behind it. Deleting it is defensible but it is not this task, and
CLAUDE.md §2.1 forbids folding unrelated cleanup into a change.

## Verification

Done 2026-07-28. 773 tests green (754 + 19), typecheck and lint clean.

**End to end against the real thing, not only mocks.** A script drove the actual
`setCached` / `getCached` / `deleteCached` against live Upstash and the local
Postgres, with Prisma query logging on:

| case           | Redis                                                        | Postgres       |
| -------------- | ------------------------------------------------------------ | -------------- |
| 7-day entry    | present ✅                                                   | no row ✅      |
| 365-day entry  | absent ✅                                                    | row present ✅ |
| read, 7-day    | served from Redis — no `SELECT` for content in the query log |
| read, 365-day  | fell through to Postgres ✅                                  |
| `deleteCached` | cleared                                                      | cleared        |

**Mutation checks.** Both halves of the routing were confirmed to be load-bearing:

| mutation                         | result                                                          |
| -------------------------------- | --------------------------------------------------------------- |
| threshold removed (all to Redis) | 1 failure — the durability fallback lands in the evicting store |
| `if (stored) return` removed     | 1 failure — write-through to both stores                        |

The second is the one worth keeping. A write-through passes every "is it in
Redis?" assertion while preserving the entire Neon write cost — it looks exactly
like a successful migration and achieves nothing.

**The build is unchanged**: same three Windows-only `@vercel/og` failures as the
TASK-291 baseline, 739/739 pages.

A false lead worth recording: the build itself wrote nothing to Redis, which
initially looked like the routing not working. It was correct — the local
Postgres still held an unexpired 12h `fresh` snapshot from an earlier build, so
`setCached` was never reached. Absence of a write is not evidence of a broken
write path when the cache upstream is warm.

## Not verified

The transfer reduction in production, for the same reason as TASK-292: the quota
is exhausted until ~1 August and none of this is deployed. Also unverified is
behaviour under Upstash's own quotas — the free tier has command and bandwidth
limits, and this moves traffic onto them. Worth watching after the first month.

## Follow-ups, deliberately not done

- **Removing `incrementHit` and the `hitCount` column.** Confirmed dead —
  only its own test imports it. CLAUDE.md §2.1 forbids folding it in here.
- **Splitting the 107.8 KB snapshot blob.** Listed as a candidate before this
  work; it is now largely pointless _for Neon usage_, because after TASK-292 and
  this change the blob is served from the Data Cache and then from Redis. It
  remains a reasonable performance change, not a transfer one.
- **The per-request `sessionVersion` read** in the auth JWT callback
  (`src/lib/auth/config.ts:99`). It is a genuine Neon read on every
  authenticated request, but it returns a single integer from an indexed lookup
  — noise next to a 107.8 KB blob — and it exists to make "sign out all devices"
  take effect immediately. Caching it would trade a security property for an
  unmeasurable saving. Left alone on purpose.
