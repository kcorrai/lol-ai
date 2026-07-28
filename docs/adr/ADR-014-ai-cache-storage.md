# ADR-014: Keep the AI cache in Redis, and durability fallbacks in Postgres

## Status: Accepted

## Context

`ai_cache` is roughly **76% of the database** (2984 kB of 3.9 MB, measured
2026-07-28). Every row in it is regenerable — meta snapshots from op.gg, AI
responses, champion detail, previews. It is a cache living in the primary
transactional database, on a plan billed by network transfer, and it is the
single largest contributor to the transfer allowance being exhausted.

TASK-282 and TASK-292 attacked the frequency of those reads: a process memo, then
a shared Next.js Data Cache. Both help and neither addresses the underlying
placement. A cache in Postgres is still a cache in Postgres; every miss at the
outer layers lands on Neon.

`@upstash/redis` is already a dependency, already provisioned
(`KV_REST_API_URL` / `KV_REST_API_TOKEN`), and already used for rate limiting and
brute-force counters. The credentials were checked from a live round trip before
this decision was taken, not assumed from the presence of the variables.

## Decision

Route entries by TTL, because they are not all the same kind of thing.

| TTL        | what it is                        | store     |
| ---------- | --------------------------------- | --------- |
| < 90 days  | cache — regenerable, read often   | **Redis** |
| >= 90 days | durability fallback — read rarely | Postgres  |

Every TTL in the codebase is 0.042, 0.25, 0.5, 1, 7, 14 or 30 days, except
`SNAPSHOT_TTL_DAYS = 365` — the `:last-good` rows, commented in the source as an
"effectively permanent fallback". The threshold sits in the wide empty gap
between 30 and 365, so it separates the two populations without being sensitive
to where exactly it is placed.

**Last-good entries are not a cache and must not be treated as one.** They are
read precisely when op.gg is unreachable, which is the one moment their absence
would matter. Redis evicts under memory pressure; Postgres does not. Leaving them
behind is also free: they are written twice a day and read only during an
outage, so they contribute nothing measurable to steady-state transfer.

Reads try Redis first and fall back to Postgres. That fallback is what lets the
change ship with no migration and no backfill — the 485 rows already in
`ai_cache` keep being served until they expire and are rewritten to Redis.

Writes go to one store, never both. A write-through would look like a migration
while preserving exactly the transfer it was meant to remove, and the Postgres
copy would then outlive the Redis one and be served stale by the fallback read.

## Consequences

**The dominant read path leaves Neon.** After TASK-292 the chain was
`memo → Data Cache → Neon`; it is now `memo → Data Cache → Redis`, with Neon
reached only for pre-existing rows and durability fallbacks.

**Expiry becomes the store's job.** Postgres rows are filtered by `expiresAt` on
read and never deleted, so dead rows accumulate; Redis expires them natively.
This is a small correctness improvement that came free.

**A cache miss can now cost two round trips.** Redis, then Postgres. This is the
price of shipping without a backfill, and it is paid on misses only. It can be
removed once the legacy rows have aged out.

**Redis failure is invisible by construction.** A read error is reported as a
miss and a write error as "not stored", so the worst outcome of Upstash being
unreachable is the work being done again — and for writes, the Postgres path
still catches it. TASK-285 is the cautionary tale here: an unguarded cache write
turned a completed preview response into a 500.

**Two stores, one logical cache.** `deleteCached` has to clear both, and anyone
debugging a stale entry has to know which side of the TTL threshold it fell on.

**A note on what did not change.** `incrementHit` still writes to Postgres. It
has no production callers — only its own test imports it — so this is dead code,
and removing it (with the `hitCount` column) is a reasonable follow-up. It was
left alone here because CLAUDE.md §2.1 forbids folding unrelated cleanup into a
change, not because it is worth keeping.

## Alternatives rejected

**Move everything, including last-good.** Simpler code and a single store, at the
cost of putting the outage fallback somewhere that evicts. The failure mode is
silent and only shows up during an op.gg outage — the worst possible time to
discover it.

**Keep Postgres and rely on TASK-292's Data Cache alone.** Already implemented
and genuinely effective, but the Data Cache is per-region and time-bounded; every
expiry still refills from Neon. It reduces the constant; it does not remove the
dependency.

**Write to both stores.** Rejected above: it is indistinguishable from success
while preserving the entire cost.

**Delete the cache and regenerate on demand.** Considered and dismissed during
TASK-282 for a reason worth restating: evicting `ai_cache` is actively harmful,
because each dropped entry means another op.gg fetch and another write — more
transfer, not less.
