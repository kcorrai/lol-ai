# TASK-282 — Neon 5GB transfer allowance exhausted

Neon alerted that `lol-ai` hit **100% of its monthly 5GB network transfer** and compute is at risk of
suspension. This is egress, not storage.

## Root cause

`getMetaSnapshot` in `src/domains/meta/services/metaStatsService.ts` had **no memoization of any
kind**. Every call went to Postgres:

```ts
const fresh = (await getCached(freshKey)) as MetaSnapshot | null;
if (fresh) return fresh;
```

`getCached` then did `prisma.aiCache.findUnique({ where: { cacheKey } })` with **no `select`**,
pulling the whole row — including a `content` blob holding the entire op.gg meta snapshot.

Measured: the raw op.gg bulk feed for 173 champions is **0.18 MB**, and the stored snapshot is of the
same order.

Three multipliers turn that into gigabytes:

1. **More than one call per render.** A page renders the tier list _and_ `getPopularChampions` for
   the related-links row — and that helper calls `getMetaSnapshot()` again. Same blob, second trip.
2. **~739 statically generated pages on a 12h ISR cycle** (`revalidate = 43200` across
   `/builds/[champion]`, `/matchups/[slug]`, `/counters/[champion]`, `/aram/*`, the tier-list role
   hubs and `/meta`). Every revalidation re-runs the loaders.
3. **A write on every read.** `getCached` fired a fire-and-forget `hitCount` increment on each hit,
   so each cache _hit_ cost an extra round trip — the opposite of what a cache is for.

Rough arithmetic: 739 pages × 2 revalidations/day × ~2 snapshot reads × 0.2 MB ≈ **0.6 GB/day**, or
~18 GB/month. The 5 GB allowance goes in well under two weeks, which matches the alert.

## Change

**`src/lib/ai/aiCache.ts`**

- `getCached` now selects only `content` and `expiresAt`. The row also carries `id`, `type`,
  `hitCount` and `createdAt`, and every unselected byte crosses the network.
- The per-read `hitCount` increment is removed. `incrementHit()` still exists for callers that
  genuinely want the telemetry.

**`src/domains/meta/services/metaStatsService.ts`**

- A process-level memo (`Map<variant, {value, expiresAt}>`, 5-minute TTL) in front of the DB read.
  The DB cache stays at 12h; this only collapses the burst of identical reads a revalidation wave
  produces, so freshness is unchanged in practice.
- Keyed by `mode:tier`, so ranked and ARAM do not evict each other. Each instance holds a handful of
  entries.
- The fetch/fallback logic moved unchanged into `loadSnapshot`; only the caching wrapper is new.

### Why failures get a shorter memo

A `null` means the feed was down _and_ no last-good row existed. Memoizing that for the full five
minutes would keep serving empty pages long after the feed recovered, so `rememberFor()` holds
failures for 30s — long enough to absorb a revalidation burst, short enough to recover quickly.

## Tests

`metaStatsService.test.ts` gained four: one read across three calls; separate memo entries per
mode/tier; a failed snapshot not held for the full window. `aiCache.test.ts` had its hit-count test
**inverted** — it previously asserted the write happens — plus a new one pinning the `select`.

`__clearSnapshotMemo()` is exported as a test seam and called in `beforeEach`; without it a value
cached by one test satisfies the next and the fetch assertions become meaningless. That is exactly
how the four pre-existing tests failed when the memo first landed.

## Still worth doing (not in this task)

- **Point local development at a Neon branch, not production.** `.env.local`'s `DATABASE_URL` is the
  prod database, so every local page load, hot reload and polling hook (`useCoachingReports`,
  `useReportStatus`, `useSyncStatus` all use `refetchInterval`) spends the production allowance. Two
  dev servers were listening on ports 3000 and 3001 during this work.
- **Lengthen ISR on the long tail.** `/matchups/[slug]` (~2000 pages) and `/builds/[champion]` do not
  need 12h freshness; 24–48h would halve or quarter the revalidation volume.
- **10 `matchParticipant.findMany` calls have no `select`** and pull all ~40 columns including the
  `itemIds` array — `milestoneService.ts:55`, `performanceSnapshotService.ts:56`,
  `rankUpService.ts:74`, `retentionService.ts:29`, `warmupService.ts:88`,
  `championDeepDiveService.ts:67`, `weeklyEmailRenderer.ts:79`, `autoSessionReview.ts:71`,
  `timelineFetcher.ts:32`, `champion-matches/route.ts:22`. Folded into TASK-256.
- `matchupService.ts:57` fetches `take: 300` participant rows to analyse the top 8 champions.

## Verification

Full suite 590 green; `tsc --noEmit` and ESLint clean.
The real proof is the Neon transfer graph flattening after deploy — worth checking a day later.

refs TASK-282
