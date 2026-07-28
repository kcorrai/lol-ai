# ADR-013: Cache the meta snapshot in a layer shared between instances

## Status: Accepted

## Context

The Neon transfer allowance (5 GB/month) was exhausted on a database holding
40 MB of data — roughly a 145× ratio between what is stored and what is moved.
Storage was, and is, 92% empty. The cost is repetition, not volume.

Measured on 2026-07-28, `ai_cache` is 2984 kB of a 3.9 MB database, and one row
inside it accounts for nearly every expensive read:
`meta:snapshot:ranked:default:fresh`, **107.8 KB**.

`getMetaSnapshot` has 25 call sites. The shape of the traffic matters more than
the count:

- `MarketingFooter` loads the full blob to render six links, and appears on every
  marketing page.
- `HeroSection` loads it for a single integer, the match counter.
- 739 statically generated pages revalidate on a 12h ISR cycle, and one render
  calls `getMetaSnapshot` more than once.

TASK-282 added a 5-minute process memo, which collapses repeats **within a warm
instance**. That is the right first move and it is not enough: a revalidation
wave across 739 pages is served by many instances, each cold with respect to a
process-local memo, each paying 107.8 KB again. The memo makes the cost
proportional to instance count instead of to page count. Both are too high.

## Decision

Insert the Next.js Data Cache (`unstable_cache`) between the process memo and
Neon, keyed per snapshot variant, with a one-hour TTL.

```
L1  process memo         5 min    per instance   (TASK-282)
L2  Next Data Cache       1 h     shared         (this ADR)
L3  ai_cache row in Neon  12 h    source of truth
```

An hour was chosen against the existing freshness contract rather than picked for
effect: `FRESH_TTL_DAYS` is 0.5, so the underlying row is replaced every twelve
hours. A one-hour shared cache cannot serve anything staler than the row already
is, which makes this a pure transport saving with no change to what users see.

**Nulls are deliberately excluded from L2.** `getMetaSnapshot` returns null when
op.gg is down _and_ no last-good row was ever written. `rememberFor()` already
treats that case specially, holding it for 30 seconds instead of 5 minutes so the
site recovers quickly. Sharing a null across every instance for an hour would
undo that and turn a brief feed outage into an hour of empty meta pages
everywhere — strictly worse than the problem being solved. `unstable_cache`
stores resolved values but not rejections, so the cached function throws a
private sentinel rather than returning null, and the caller converts it back.

## Consequences

**Neon reads for this blob become proportional to time, not to traffic.** At most
one read per variant per hour per cache region, instead of one per cold instance.
Against the measured 107.8 KB payload that is the difference between hundreds of
megabytes a month and single-digit megabytes — a projection from payload size and
call pattern, not a measurement, and it stays a projection until the quota resets
and the code is actually deployed.

**Writes drop too, as a side effect.** `loadSnapshot` writes the fresh and
last-good rows after a successful op.gg fetch; under L2 that happens on a cache
miss rather than on every cold instance.

**A third cache layer is a third place to be confused by.** Three TTLs now govern
one value. They are ordered (5 min < 1 h < 12 h) so a shorter layer can never
serve something the longer one has already replaced, but anyone debugging a
stale-meta report has to walk all three.

**`unstable_cache` is a Next.js API with an unstable name.** It is called from
`generateStaticParams`, which runs outside a request scope during the build; that
this is legal was verified by building, not assumed. A future Next.js upgrade
should re-check it — Next 15 supersedes it with `use cache`.

## Alternatives rejected

**Raise the process memo TTL.** Cheapest possible change, and it does not address
the failure: the memo is per instance, so a wave of cold instances pays in full
no matter how long the TTL is. It also trades freshness for a partial fix.

**Move the snapshot to Upstash Redis.** `@upstash/redis` is already a dependency,
and a cache genuinely belongs there rather than in the primary database. Rejected
for now on scope, not on merit: it is env-gated (`KV_REST_API_URL`), currently
used only for rate limiting and brute-force counters, and would need a fallback
path for when it is unconfigured. The Data Cache needs no provisioning and no new
failure mode. Worth revisiting if snapshot traffic is still visible after this.

**Split the blob so small consumers read a ~2 KB summary.** Attacks the other
half of the problem — the footer really should not load 107.8 KB for six links —
and remains worth doing. It is a larger change touching storage layout and every
consumer, and it is substantially redundant once L2 absorbs the reads, so it is
recorded as follow-up rather than bundled here.
