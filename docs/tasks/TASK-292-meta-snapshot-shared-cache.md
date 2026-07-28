# TASK-292: Stop re-reading the meta snapshot from Neon on every instance

## Status: Done

## Context

Measured against the local database on 2026-07-28:

| table           | size    | share             |
| --------------- | ------- | ----------------- |
| `ai_cache`      | 2984 kB | ~76% of the whole |
| everything else | ~950 kB | the rest          |

Inside `ai_cache`, one row dominates every read:

| cache key                                | size         |
| ---------------------------------------- | ------------ |
| `meta:snapshot:ranked:default:fresh`     | **107.8 KB** |
| `meta:snapshot:ranked:default:last-good` | 107.8 KB     |
| `meta:snapshot:aram:default:*`           | 35.4 KB each |
| ~470 × `meta:detail:*`                   | 5.7 KB each  |

**The problem is not size, it is repetition.** 107.8 KB is nothing to store —
storage sits at 0.04 of 0.5 GB. It is what happens when that blob crosses the
network on every render that turned a 40 MB database into 5.8 GB of monthly
transfer.

`getMetaSnapshot` is called from 25 call sites. Three of them make it expensive:

- `MarketingFooter` calls `getPopularChampions(6)`, which loads the whole
  107.8 KB blob to render **six links**. The footer is on every marketing page.
- `HeroSection` loads the same blob for a single number, the match counter.
- 739 statically generated pages revalidate on a 12h ISR cycle, and a single
  page render calls `getMetaSnapshot` more than once.

TASK-282 put a 5-minute process-level memo in front of the row, which collapses
repeat calls **within one warm instance**. That fix is committed and has never
been deployed. It also does not address the shape of the problem: a serverless
deployment has many instances, and a revalidation wave across 739 pages lands on
instances that are each cold with respect to that memo. Every cold instance pays
107.8 KB again.

There is no shared cache layer anywhere in this project — `unstable_cache` does
not appear in the codebase.

## Decision

Add a shared second level between the process memo and Neon, using the Next.js
Data Cache (`unstable_cache`), keyed per snapshot variant.

The read path becomes:

1. **L1** — process memo, 5 minutes (TASK-282, unchanged). Fastest, per instance.
2. **L2** — Next Data Cache, 1 hour, shared across instances and persisted. New.
3. **L3** — the `ai_cache` row in Neon.

One hour is a deliberately conservative choice against the existing freshness
contract: `FRESH_TTL_DAYS` is 0.5, so the underlying row is only replaced every
12 hours. An hour of shared caching cannot serve anything staler than the row
already is.

### Nulls must not enter the shared cache

`getMetaSnapshot` returns null when the op.gg feed is down _and_ no last-good row
was ever written. The existing code memoizes that for 30 seconds rather than the
full 5 minutes, precisely so the site recovers quickly once the feed returns.
Persisting a null in a shared, hour-long cache would defeat that — every instance
would serve empty pages for an hour.

`unstable_cache` stores whatever the callback resolves with, including null, but
it does **not** store rejections. So the cached callback throws a private
sentinel instead of returning null, and the caller converts it back. The sentinel
never escapes the module.

## Scope

- `src/domains/meta/services/metaStatsService.ts` — the two cache levels.
- `src/domains/meta/services/metaStatsService.test.ts` — cover both the hit path
  and the null-is-not-cached guarantee.
- ADR-013.

Out of scope, and recorded in the report rather than done here:

- Splitting the 107.8 KB blob so the footer/hero/sitemap read a ~2 KB summary
  instead of the full champion array. Worth doing, larger change, and mostly
  redundant once L2 absorbs the reads.
- Moving the cache to Upstash Redis. `@upstash/redis` is already a dependency but
  is env-gated and only used for rate limiting and brute-force counters.

## Verification

Done on 2026-07-28. 754 tests green (750 + 4), typecheck and lint clean.

**The new tests fail against unfixed code.** Both guarantees were checked by
mutating the source and confirming the suite goes red, because a cache test that
passes with the cache removed asserts nothing:

| mutation                                                 | result                                                  |
| -------------------------------------------------------- | ------------------------------------------------------- |
| call `loadSnapshot` directly, bypassing the shared cache | 2 failures — cold instance re-reads the row             |
| return null instead of throwing the sentinel             | 3 failures — including a **pre-existing** TASK-282 test |

The second mutation is the more interesting one. Letting nulls into the shared
cache breaks "does not memoize a failed snapshot for the full window", a test
written for TASK-282 and untouched here. The hazard is not theoretical; the
existing suite already objects to it.

The test double for `unstable_cache` models one property only — resolved values
are stored, rejections are not — because that is the property the production code
depends on. A pass-through mock would have made all four tests vacuous.

**The build is unchanged.** `unstable_cache` is called from
`generateStaticParams`, which runs outside a request scope during the build, so
whether that is legal was settled by building rather than by reading the docs.
With `NODE_ENV=production` and the database up, the run produces an error set
_identical_ to the TASK-291 baseline — the same three Windows-only `@vercel/og`
failures, nothing new — and generates 739/739 pages in both. No
`unstable_cache`-related warnings appear in either log.

Both traps recorded in TASK-291 apply and were controlled for: `NODE_ENV` must be
`production` or the comparison is meaningless, and the three `@vercel/og`
failures are a Windows path artefact unrelated to any of this.

## Not verified

The actual reduction in Neon transfer. The quota is exhausted until ~1 August and
the fix cannot be deployed before then, so the effect is a projection from the
measured payload size and call pattern, not an observation. Re-measure after the
first full month on the deployed code before drawing conclusions — as TASK-282
already warned, 5.8 GB is the number for the broken state.
