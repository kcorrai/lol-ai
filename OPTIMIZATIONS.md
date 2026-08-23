# OPTIMIZATIONS.md

Full optimization audit — LoL AI Coach.

**Scope audited:** `src/domains/**`, `src/lib/**`, `app/**`, `prisma/schema.prisma`, `next.config.mjs`, `middleware.ts`.
**Codebase size:** 1671 TS/TSX files, 19 domains, 181 API routes, 665 TSX (343 client components), 537 Prisma call sites.
**Method:** static read of hot paths (Riot ingest, match archive, messaging, meta snapshot, AI cache, frontend bundle). No profiler or production telemetry was available — every claim below is labelled either **measured-from-code** (the inefficiency is structurally present and provable by reading) or **likely** (needs a metric to confirm magnitude).

**Status: implemented.** This was written as a report; the findings were then applied on branch
`agent/4`, one commit per finding, each with tests. `tsc --noEmit` and `next lint` are clean and the
suite is at 2480 passing (from 2384 — the difference is tests added here). See **Implementation
status** below for what shipped, what did not, and the three places where acting on a finding proved
it partly wrong.

---

## Implementation status

Applied on `agent/4`, one finding per commit. Where reality disagreed with the report, the code
follows reality and the disagreement is recorded here rather than quietly dropped.

### Shipped

| Finding     | Commit    | Note                                                                                                           |
| ----------- | --------- | -------------------------------------------------------------------------------------------------------------- |
| F-01        | `580b05b` | Verified against the dev database — the old query fails with exactly the predicted `42703`, the new one runs   |
| F-02        | `b8667d1` | Ingest concurrency 8; test asserts start/end interleaving, confirmed failing at limit 1                        |
| F-03        | `f3cb76b` | ~100 round trips → 1                                                                                           |
| F-04 + F-05 | `bf39aa8` | Landed together — separating them would leave the backfill sweep duplicating the new durable step for a commit |
| F-06        | `668b873` | Sentinel rather than a schema column, so no migration                                                          |
| F-08        | `ef50ba9` | Plus tests for `dedup` itself, which had none                                                                  |
| F-09        | `e294eef` | 500-entry LRU. The JSON round trip is deliberately kept — see below                                            |
| F-11        | `aa42180` | `ArchivePage.totals` is now nullable on continuation pages                                                     |
| F-12        | `1459721` | Write guard + partial index migration (unapplied — see below)                                                  |
| F-13        | `59ffe80` | `DISTINCT ON` with `unnest`, verified against the live schema                                                  |
| F-14        | `8ab91c2` | 10s timeout                                                                                                    |
| F-15        | `cfd90af` | Measured, not estimated — numbers below                                                                        |
| F-16        | `4355922` | 19 round trips → 3                                                                                             |
| F-18        | `99c1f9f` | `getReport` only; the sibling was dropped — see below                                                          |
| F-19        | `b2f39a8` | Shared module in `src/lib/kda.ts`; no displayed value changes                                                  |
| F-20        | `14f0503` | Two of three removed                                                                                           |
| F-21 + F-22 | `59f29ec` | Same file, one commit                                                                                          |
| F-23        | `e6df92a` | Folded into the retry fix below                                                                                |
| F-24        | `c1415ca` | Confirmed it fails, naming the path, when an entry is dropped                                                  |
| F-25        | `cae78f8` | Warns rather than throws                                                                                       |

Plus `36cde85`, the bounded-concurrency helper F-02 and F-04 both needed.

### F-15, measured

`next build`, raw bytes across each route's client chunk set, before → after:

```
/(app)/dashboard/page                1141KB → 775KB   (15 → 14 chunks)
/(team)/teams/[teamId]/page          1086KB → 725KB
/(team)/teams/[teamId]/members/page  1090KB → 728KB
/(app)/teams/page                     646KB → 646KB   (control, no chart)
```

The members route is the one worth noting: it was pulling the whole charting library eagerly and
does not draw a chart. The recharts chunk is now in no route's eager set.

`next build` does not complete in this environment — five opengraph-image routes need network at
export — but that failure is identical before and after, and the client manifest these numbers come
from is written before it.

### Not shipped, and why

**F-10 — archive facet ID lists.** This report set its own criterion: measure p95 `IN`-list length
first, and if it is under ~200 ids, deprioritize entirely. Measured: the largest per-player archive
in the dev database is 5 rows. There is nothing to measure, the change needs an ADR, and it risks
the cursor-stability property `matchArchiveService.ts` documents carefully. F-11 has meanwhile
removed two of the three transmissions on continuation pages.

**F-17 — GIN index on `matchesAnalyzed`.** Same discipline. `coaching_reports` holds 0 rows, so
`EXPLAIN ANALYZE` can say nothing, and this report's own text says an index that is never chosen is
pure write overhead. The SQL was validated in a rolled-back transaction and is ready when there is a
volume to justify it.

**F-18, the `riotAccount` half.** Inspected and dropped: that table is seventeen narrow columns with
no blob, so the transfer saving is negligible, while narrowing it means changing
`syncRankedSnapshot`'s signature off `RiotAccount`. The `getReport` half, which carries five
Json/Text blobs, shipped.

**F-20, `isEmptyFilter`.** Looked as dead as the other two and is not. The archive is still API-only
and the screen that needs "everything" versus "nothing matched" is LA-36, in flight. What was wrong
with it was the doc comment claiming a UI that does not exist yet; that was fixed instead.

**F-09, the serialization half.** The eviction cap shipped; the `JSON.parse`/`stringify` on every
get and set did not. It is real CPU on the hit path for no transport benefit, but removing it means
callers share the cached object and one mutation anywhere becomes visible to the next reader. That
needs the callers audited, and it was never the unbounded-growth problem.

**Both migrations are written but unapplied.** `20260819120000_add_match_timeline` was already
pending from LA-45 before this work started, and applying mine would drag it in. LA-47 owns landing
them. Both were validated against the dev database inside rolled-back transactions.

### Where the report was wrong

**The retry layer was worse than described.** F-07 and F-23 both assumed `withRetry` worked and
merely needed jitter. It never retried anything: `normalizeRiotError` returns an `ApiError`, which
names its field `statusCode`, and `withRetry` read `status`. That was always `undefined`, so every
error took the "non-retryable errors propagate immediately" branch — a transient Riot 503 or a 429
failed the caller on the first attempt. Fixed in `e6df92a`, with the tests the file never had. This
also makes the report's account of **LA-5** more direct than the rate-limiter theory it offered.

**F-19 overstated the divergence.** It claimed `recapChapters`' `deaths > 0 ? (k + a) / deaths : k +
a` disagreed with the floor form at zero deaths. It does not — `max(deaths, 1)` makes both
`kills + assists` there. The only real difference across the six sites was rounding, which is why
they could be consolidated without changing a single displayed value. There is now a test pinning
that equivalence.

**F-07's remaining half is still open.** The reservation race and the per-process bucket are
untouched — the retry fix removed the compounding factor, not the cause. This is the largest thing
left in this document.

### Found while implementing, not in the original audit

**The dev seed rosters are malformed.** Every linked account plays MIDDLE and no match has a
team-200 MIDDLE player — the rosters carry a second TOP where MIDDLE should be (positions:
TOP 15, others 10, MIDDLE 5). The self-join in F-01 is correct and produces six pairings on the seed
data, but nothing that depends on a lane opponent can be verified locally: personal matchups, the
counter picker's personal half, the matchup matrix. Filed as LA-50.

---

## 1) Optimization Summary

### Current health

Two very different pictures sit side by side.

The **caching architecture is genuinely good**. `src/lib/ai/aiCache.ts` (Redis → Postgres tiering with a documented durability line at 90 days) and `src/domains/meta/services/metaStatsService.ts` (three-tier: process memo → Next Data Cache → aiCache row) are better than most production codebases. Someone has already fought and won a Neon egress fight, and the comments record why. ISR coverage on public pages is thorough (27 pages with explicit `revalidate`). Cursor pagination is used correctly in the archive and report list. Cache failures are non-fatal by design.

The **write and ingest paths are not optimized at all**. `syncAccount` — the single most expensive operation in the product — is fully serialized where it could be concurrent, issues up to 100 no-op UPDATE round trips on every run, and spawns unbounded orphaned fan-out that fights its own rate limiter. That one function is where the latency and the Riot quota go.

Separately: **the frontend has zero code splitting** (0 uses of `next/dynamic` across 665 components), and **one service is dead on arrival** — `personalCounterService.ts` queries column names that do not exist in the database.

### Top 3 highest-impact improvements

| #   | Change                                                                                                                                    | Where                                              | Expected                                                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | Bound-concurrency the match ingest loop, collapse the 100 no-op `updateMany` calls into one, and stop the per-match orphaned rank fan-out | `matchSyncService.ts`, `matchSyncRankedService.ts` | Sync wall-clock **~40s → ~6s** on a 100-match Pro sync; Riot calls per sync down ~10×             |
| 2   | Fix `personalCounterService` column names (LA-38) and cache the empty result                                                              | `personalCounterService.ts`                        | Feature goes from **0% working to working**; removes a guaranteed-throw DB round trip per request |
| 3   | Introduce `next/dynamic` for Recharts / framer-motion + `optimizePackageImports`                                                          | `next.config.mjs`, 2 chart components              | **~110–160 KB gzip** off first load on chart-bearing routes; LCP budget in CLAUDE.md §10 is 3s    |

### Biggest risk if nothing changes

**Riot API rate-limit collapse under concurrency, presenting as random sync failures.** Three compounding causes:

1. `TokenBucket` (`src/lib/riot/rateLimit.ts`) is **per-process**. On Vercel Fluid Compute with N warm instances the effective aggregate rate is `N × 20 req/s`, not 20. Riot enforces the real limit and returns 429.
2. `TokenBucket.consume()` does not reserve a token before sleeping. Concurrent callers that find the bucket empty all compute the _same_ `waitMs`, all sleep, and all wake and proceed together — a thundering herd that overshoots by exactly the number of waiters.
3. `enrichParticipantRanks` is fired unawaited **once per new match** inside the ingest loop, each doing 10 serial Riot calls. A 50-match sync launches 50 concurrent chains → up to 500 in-flight Riot requests from one user action.

Under load these interact: the herd overshoots, Riot 429s, `withRetry` backs off, and the sync appears to hang. Card **LA-5** ("Sync error banner blames Riot for every profile failure") is very likely a downstream symptom of this rather than an independent copy bug.

---

## 2) Findings (Prioritized)

---

### F-01 · `personalCounterService` raw SQL uses column names the database does not have

- **Category:** DB
- **Severity:** Critical
- **Impact:** Correctness (feature is 100% broken), plus a wasted DB round trip + error-handling cost per request
- **Evidence:** `src/domains/counter/services/personalCounterService.ts:48-70` and `:77-88`

  ```sql
  SELECT opp.champion_id AS opponent_champion_id, ...
  FROM match_participants mp
  WHERE mp.riot_account_id = ${riotAccountId}::uuid
    AND mp.champion_id = ${championId}
    AND m.queue_type = 'RANKED_SOLO_5x5'
  ORDER BY m.game_start DESC
  ```

  `prisma/schema.prisma:447-498` declares `MatchParticipant` with `@@map("match_participants")` on the **table** and **no field-level `@map` anywhere in the file** (verified: all 68 `@map(` occurrences are `@@map` table maps). The real columns are therefore `championId`, `riotAccountId`, `matchId`, `teamId`, `championName`. Same for `Match` (`schema.prisma:423-445`): `queueType`, `gameStart`, not `queue_type` / `game_start`.

- **Why it's inefficient:** Every call reaches Postgres, is parsed, fails on `column opp.champion_id does not exist`, and throws. The caller pays full connection + parse cost for a guaranteed error, and the `setCached` at the end is never reached — so the failure recurs on every single request forever. Cache-miss amplification on a permanently failing path.
- **Recommended fix:** Quote camelCase identifiers exactly as `matchArchiveService.ts:88-92` already documents doing it (`mp."puuid"`, `mp."kills"`). That file's comment names LA-38 explicitly as the precedent. Then add a regression test that runs the query against a real schema — the bug is invisible to `tsc` because `$queryRaw` is untyped at the SQL level.
- **Tradeoffs / Risks:** None. It is currently non-functional.
- **Expected impact estimate:** Feature availability 0% → 100%.
- **Removal Safety:** N/A (fix, not removal)
- **Reuse Scope:** local file
- **Note:** Already tracked as board card **LA-38**. Listed here because it also has a measurable cost profile, not only a correctness one.

---

### F-02 · Match ingest loop is fully serialized

- **Category:** Concurrency / Network
- **Severity:** Critical
- **Impact:** Sync latency, throughput, perceived product speed
- **Evidence:** `src/domains/riot/services/matchSyncService.ts:88-118`

  ```ts
  for (const riotMatchId of newMatchIds) {
    const dto = await getMatch(riotMatchId, account.region);   // ~150–400ms Riot RTT
    ...
    await prisma.$transaction(async (tx) => { ... });          // ~20–60ms Neon RTT
  }
  ```

  `newMatchIds` is bounded by `matchHistoryDepth` (`src/lib/auth/planLimits.ts:34,45` — 100 for `pro`, 200 for `elite`/`team`, hard-capped at 100 by `getMatchIds`'s `Math.min(count, 100)`).

- **Why it's inefficient:** Each iteration is a full network round trip to Riot plus a Postgres transaction, executed one at a time. The rate limiter directly above it (`riotRateLimiter`, 20 req/s burst 20) is provisioned for 20× this throughput and sits almost entirely idle. This is latency the architecture already paid for and is not spending.
- **Recommended fix:** Bounded-concurrency pool of 5–8 over `newMatchIds`. Do not use unbounded `Promise.all` — that trades this problem for F-04's. Collect `seenPlayers` into a shared array (order is irrelevant; it is deduped downstream by `indexPlayers`). Keep `getMatch`'s existing `dedup()` — it already handles the overlap case correctly.
- **Tradeoffs / Risks:** Concurrent `prisma.$transaction` calls raise pool pressure; with pgbouncer + `connection_limit=1` (see F-25) a concurrency of 5–8 is safe. Error attribution per match must be preserved — keep the per-item try/catch inside the pooled task, not around the pool.
- **Expected impact estimate:** **~85% reduction in sync wall-clock.** 100 matches × ~350ms serial ≈ 35–40s → ≈ 5–7s at concurrency 8.
- **Removal Safety:** Needs Verification (behaviour-preserving but touches the ingest transaction)
- **Reuse Scope:** service-wide — the same pool utility applies to F-03, F-04 and F-05

---

### F-03 · Up to 100 no-op `UPDATE` round trips on every sync

- **Category:** DB
- **Severity:** High
- **Impact:** Sync latency, Neon query volume, connection-pool occupancy
- **Evidence:** `src/domains/riot/services/matchSyncService.ts:126-133`

  ```ts
  for (const [riotMatchId, dbMatchId] of existingByRiotId) {
    if (!matchIds.includes(riotMatchId)) continue;
    await prisma.matchParticipant.updateMany({
      where: { matchId: dbMatchId, puuid: account.puuid, riotAccountId: null },
      data: { riotAccountId: account.id },
    });
  }
  ```

- **Why it's inefficient:** Three separate problems in eight lines.
  1. `existingByRiotId` is built _from_ a query keyed on `matchId: { in: matchIds }` (line 72-75), so **every** entry is already in `matchIds` — the `.includes()` guard is always true and is O(n²) for nothing.
  2. One sequential `updateMany` per already-known match. On a steady-state sync of a returning user, nearly every match is already known, so this is ~100 sequential Neon round trips.
  3. Every one of them matches **zero rows** after the first successful sync — the `riotAccountId: null` predicate is only satisfiable once per account per match. This is pure waste on every subsequent sync forever.
- **Recommended fix:** One statement.
  ```ts
  await prisma.matchParticipant.updateMany({
    where: {
      matchId: { in: [...existingByRiotId.values()] },
      puuid: account.puuid,
      riotAccountId: null,
    },
    data: { riotAccountId: account.id },
  });
  ```
  Semantically identical — the per-match `where` clauses differ only by `matchId`.
- **Tradeoffs / Risks:** None. Strictly fewer statements, same predicate set. `@@index([riotAccountId, matchId])` on `schema.prisma:492` does not serve this (leading column is nullable and being filtered for NULL); `@@index([puuid])` at `:496` will.
- **Expected impact estimate:** **~100 round trips → 1.** At ~25ms Neon RTT that is **~2.5s off every single sync**, including syncs that ingest nothing.
- **Removal Safety:** Safe
- **Reuse Scope:** local file

---

### F-04 · Unbounded orphaned fan-out of rank enrichment during ingest

- **Category:** Concurrency / Reliability / Cost
- **Severity:** High
- **Impact:** Riot rate-limit exhaustion, lost work, unpredictable sync failure
- **Evidence:** `matchSyncService.ts:110-115` (inside the ingest loop):

  ```ts
  enrichParticipantRanks(matchDbId, puuids, account.region).catch((err) => logger.warn(...));
  ```

  and `matchSyncRankedService.ts:24-44`:

  ```ts
  export async function enrichParticipantRanks(matchDbId, participantPuuids, region) {
    for (const puuid of participantPuuids) {          // 10 puuids
      const entries = await getRankedEntriesByPuuidDirect(puuid, region);  // 1–2 Riot calls
      ...
      await prisma.matchParticipant.updateMany({ ... });                   // 1 DB write
    }
  }
  ```

- **Why it's inefficient:** Three compounding failures.
  - **Unbounded concurrency:** the promise is never awaited and never tracked, so a 50-match sync has up to 50 of these running at once — up to 500 in-flight Riot requests plus 500 writes, from a single user action. They contend with the ingest loop's own calls at the same token bucket, so the limiter starts inserting sleeps and _everything_ slows down together.
  - **Serial inside:** each chain does 10 puuids one at a time — 10 × (Riot RTT + DB RTT) ≈ 3–4s per match even in isolation.
  - **Orphaned:** on Vercel, work not awaited and not handed to `waitUntil` can be terminated when the invocation returns. Rank data silently goes missing, which is precisely what the `unrankedMatches` backfill block at `:137-147` exists to paper over. The backfill is a workaround for this bug.
- **Recommended fix:** (a) Replace the inner `for` with a bounded pool or a single batched lookup — `getRankedEntriesByPuuidDirect` is already cached 300s per puuid, so repeat players across a sync are nearly free; the serialization is the only real cost. (b) Collect the 10 `updateMany` calls into one grouped write per rank value, or a single `$transaction`. (c) Either await the fan-out inside the concurrency pool from F-02, or hand it to a durable Inngest step — Inngest is already a dependency and already used for six other post-sync events at `:154-160`.
- **Tradeoffs / Risks:** Awaiting it lengthens the critical path unless F-02's pool lands first. Moving it to Inngest is the better shape and matches how the rest of the post-sync work is already handled.
- **Expected impact estimate:** **~10× reduction in peak Riot request concurrency** during sync. Removes the dominant 429 source. Once reliable, the `unrankedMatches` backfill block (F-05) can be deleted entirely.
- **Removal Safety:** Needs Verification
- **Reuse Scope:** module

---

### F-05 · Rank backfill block: 150 serial Riot calls, unbounded query

- **Category:** Network / DB
- **Severity:** High
- **Impact:** Sync latency (adds 15–30s), Riot quota
- **Evidence:** `matchSyncService.ts:137-147`

  ```ts
  const unrankedMatches = await prisma.match.findMany({
    where: {
      queueType: "RANKED_SOLO_5x5",
      participants: { some: { riotAccountId: account.id } },
      AND: { participants: { some: { rankTier: null } } },
    },
    select: { id: true, participants: { select: { puuid: true } } },
    take: 15,
  });
  for (const m of unrankedMatches) {
    await enrichParticipantRanks(
      m.id,
      m.participants.map((p) => p.puuid),
      account.region
    );
  }
  ```

- **Why it's inefficient:**
  - **15 × 10 = 150 serial Riot calls**, awaited on the critical path of every sync. At 150ms each that is ~22s added to a sync that has already done its actual work.
  - The `where` uses **two correlated `EXISTS` subqueries** over `match_participants` with no time bound. `@@index([queueType, gameStart])` (`schema.prisma:443`) cannot help because `gameStart` is unconstrained — the planner scans the ranked-match set. This grows with total table size, not with the user.
  - `select: { participants: { select: { puuid: true } } }` pulls **all 10** participants per match as a second Prisma query.
  - There is no "already attempted" marker, so a match whose participants genuinely have no rank (unranked players, deleted accounts) is re-attempted on **every sync forever** — 10 wasted Riot calls per such match per sync, permanently.
- **Recommended fix:** Move the whole block out of the request path into the existing Inngest post-sync fan-out (`:154-160`). Bound the query by `gameStart` (e.g. last 30 days). Add an attempt marker or a `rankEnrichedAt` timestamp so permanently-unrankable matches are retired instead of retried forever. If F-04 is fixed properly this block should not need to exist.
- **Tradeoffs / Risks:** Moving it async delays rank display on old matches by seconds — invisible to a user who just triggered a sync.
- **Expected impact estimate:** **~20s off every sync.** Eliminates a permanent per-sync Riot quota leak.
- **Removal Safety:** Likely Safe (it is a backfill; deferring it is correct)
- **Reuse Scope:** local file

---

### F-06 · `backfillMatchNicknames` re-fetches the full match from Riot on every page view of an affected match

- **Category:** Network / Cost
- **Severity:** High
- **Impact:** Riot quota, hidden per-request latency, unbounded repetition
- **Evidence:** `src/domains/match/services/matchService.ts:178-181`

  ```ts
  if (participants.some((p) => !p.gameName)) {
    backfillMatchNicknames(match.id, match.matchId, match.region).catch(() => undefined);
  }
  ```

  and `matchSyncRankedService.ts:46-58`:

  ```ts
  const dto = await getMatch(riotMatchId, region);          // cacheTtl: 0 — real network call
  for (const p of dto.info.participants) {
    if (!p.riotIdGameName) continue;
    await prisma.matchParticipant.updateMany({ ... });      // up to 10 serial writes
  }
  ```

- **Why it's inefficient:** The guard is `some(p => !p.gameName)`, but the fix is `if (!p.riotIdGameName) continue`. **When Riot itself does not return a name** — bots, deactivated accounts, or older matches where the field is absent — the row stays `null`, the guard stays true, and the backfill fires again on the _next_ view. And the one after that. Forever. Each firing is a full match-detail fetch (`getMatch` is explicitly `cacheTtl: 0`, "caller caches at a higher level" — this caller does not) plus 10 sequential `updateMany` writes, consuming a rate-limiter token that the sync path needs.

  It is also fire-and-forget, so on Vercel it may be killed mid-write, leaving exactly the state that triggers it next time.

- **Recommended fix:** Add a terminal marker — a `nicknamesBackfilledAt` column on `Match`, or write a sentinel (`gameName: ""` rather than `null`) for participants Riot did not name — so the condition can actually become false. Collapse the 10 writes into one `$transaction` or a grouped `updateMany`. Give `getMatch` a real TTL here, since finished match detail is immutable by definition.
- **Tradeoffs / Risks:** A schema column needs discussion per CLAUDE.md §8.2. The sentinel approach needs no migration and is the cheaper first move.
- **Expected impact estimate:** On a match with any unnameable participant: **from unbounded (1 Riot call + 10 writes per page view) to exactly one, ever.**
- **Removal Safety:** Needs Verification
- **Reuse Scope:** module

---

### F-07 · Riot rate limiter is per-process and has a thundering-herd race

- **Category:** Concurrency / Reliability
- **Severity:** High
- **Impact:** 429 storms, sync failures, wasted retry budget
- **Evidence:** `src/lib/riot/rateLimit.ts:24-36`

  ```ts
  async consume(): Promise<void> {
    this.refill();
    if (this.tokens >= 1) { this.tokens -= 1; return; }
    const waitMs = Math.ceil((1 - this.tokens) / this.refillRatePerMs);
    await sleep(waitMs);
    this.tokens = 0;          // ← no re-check, no reservation
  }
  ```

  and `:47-53` — `export const riotRateLimiter = new TokenBucket(...)`, a module singleton.

- **Why it's inefficient:**
  - **No reservation.** K concurrent callers arriving at an empty bucket each read the same `this.tokens`, each compute the same `waitMs`, each sleep the same duration, and all K wake and return together — every one of them believing it holds a token. The limiter permits a burst of K, not 1. There is no queue and no serialization.
  - **Per-process.** The comment says "shared across all Riot API calls in this process," which is accurate and is exactly the problem: on Fluid Compute the aggregate ceiling is `instances × 20 req/s`. Riot's limit is global to the API key.
  - `this.tokens = 0` after the sleep discards fractional tokens accrued during the wait, so sustained throughput drifts below the configured rate even in the single-caller case.
- **Recommended fix:** (a) Serialize waiters through a promise chain or a FIFO queue so each `consume()` reserves its token before sleeping — a self-contained ~15-line fix that removes the burst entirely. (b) For the cross-instance limit, move the bucket to Upstash Redis. `@upstash/ratelimit` is already a dependency, `src/lib/api/rateLimitBackends.ts` already exists, and the client-construction pattern in `src/lib/cache/redisCache.ts:40-58` is directly reusable.
- **Tradeoffs / Risks:** Redis-backed limiting adds ~10–30ms per Riot call. Given each Riot call is 150ms+ this is acceptable; keep the in-process bucket as a first-line filter and consult Redis only when it would otherwise block.
- **Expected impact estimate:** Eliminates the primary 429 source. Directly reduces retry volume in `withRetry` (3 attempts × 1–10s backoff each).
- **Removal Safety:** Needs Verification
- **Reuse Scope:** service-wide

---

### F-08 · Match timeline fetches are uncached, undeduplicated, and per-player

- **Category:** Network / Memory / Cost
- **Severity:** High
- **Impact:** Riot quota, function memory, ingest latency
- **Evidence:** `src/domains/riot/services/riotApiClient.ts:48-56`

  ```ts
  export async function getMatchTimeline(matchId, region) {
    return riotClient.get<MatchTimelineDTO>(url, { cacheTtl: 0 });
  }
  ```

  No `cacheKey`, no `dedup()`. Compare `getMatch` immediately below at `:139-148`, which _is_ wrapped in `dedup(CacheKeys.matchDetail(matchId), ...)`.

  Consumer: `src/domains/riot/services/timelineService.ts:22` — called per `(match, riotAccount)` pair.

- **Why it's inefficient:** A Match-v5 timeline is one of the largest payloads Riot serves — typically **1–5 MB** of frame-by-frame JSON. It is fetched, fully parsed into a JS object, scanned for `CHAMPION_KILL` events, and discarded. Two tracked accounts in the same game fetch the same multi-MB document twice; a concurrent double-sync fetches it twice more. `getMatch` was given `dedup()` for precisely this reason and the timeline was not.
- **Recommended fix:** Wrap in `dedup(CacheKeys.matchTimeline(matchId), ...)` — matching the `getMatch` pattern exactly. That alone collapses concurrent duplicates. Do **not** add a long `cacheTtl` on the default `riotCache`: it is an in-memory `Map` (F-09) and multi-MB timelines are exactly what should not go in it. If persistent timeline caching is wanted, store the _extracted death events_ (already done, `matchDeathEvent`) and never the raw DTO.
- **Tradeoffs / Risks:** None for dedup — it is the same guarantee `getMatch` already relies on.
- **Expected impact estimate:** Removes duplicate multi-MB transfers; **~50% fewer timeline fetches** in any match with two tracked players, 100% of concurrent duplicates.
- **Removal Safety:** Safe
- **Reuse Scope:** module

---

### F-09 · `riotCache` is an unbounded in-memory Map that also double-serializes

- **Category:** Memory
- **Severity:** Medium
- **Impact:** Function memory growth (Active-CPU/memory billing), CPU on every cache op
- **Evidence:** `src/lib/riot/cache.ts:13-42`

  ```ts
  class MemoryCacheStore implements CacheStore {
    private readonly store = new Map<string, CacheEntry>();
    async get<T>(key) { ... if (Date.now() > entry.expiresAt) { this.store.delete(key); return null; }
                        return JSON.parse(entry.value) as T; }
    async set<T>(key, value, ttlSeconds) { this.store.set(key, { value: JSON.stringify(value), ... }); }
  }
  ```

- **Why it's inefficient:**
  - **Expiry is lazy-on-read only.** An entry that is written and never read again is retained for the life of the process. There is no sweeper, no max size, no LRU. On Fluid Compute, instances are deliberately long-lived and reused across many requests — the exact environment where this grows without bound. Every distinct puuid that syncs adds summoner + match-id + mastery entries (mastery alone is a ~170-element array per player) that are never evicted.
  - **`JSON.stringify` on set and `JSON.parse` on get.** The value never leaves the process, so the serialization buys nothing but structural isolation. On a mastery array or a ranked-entries list this is real CPU on the hit path — the path a cache exists to make fast.
- **Recommended fix:** Add a max-entry cap with LRU eviction, or a periodic sweep. Store values by reference and `Object.freeze` them if isolation is the concern. The `CacheStore` interface is already async and the file's own comment anticipates a Redis swap — this is the intended seam.
- **Tradeoffs / Risks:** Dropping `JSON.parse` means callers share the object; if any caller mutates a cached DTO, that mutation becomes visible to the next reader. Worth a quick grep before changing serialization — the eviction cap is independently safe.
- **Expected impact estimate:** Bounded rather than unbounded memory (**Likely** — needs a per-instance memory metric to size). Removes parse/stringify from every Riot cache op.
- **Removal Safety:** Needs Verification (the serialization half)
- **Reuse Scope:** module

---

### F-10 · Archive facet resolution materializes unbounded ID lists and ships them three times

- **Category:** DB / Network
- **Severity:** Medium
- **Impact:** Query size, Neon transfer, planner behaviour
- **Evidence:** `src/domains/match/services/matchArchiveService.ts:93-100` returns every matching participant id:

  ```ts
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT mp."id" FROM match_participants mp
    WHERE mp."puuid" = ${puuid} AND (mp."kills" + mp."assists")::float / GREATEST(mp."deaths", 1) >= ${minKda}`;
  return rows.map((r) => r.id);
  ```

  fed into `matchArchiveFilters.ts:139` as `{ id: { in: resolved.kdaParticipantIds } }`, then used by **three** queries in `searchArchive` — the page `findMany` (`:112`) and both aggregates inside `archiveTotals` (`:194-202`).

- **Why it's inefficient:** A veteran player's archive can hold thousands of games. Every UUID is 36 characters; 3000 ids is a **~110 KB `IN` list**, transmitted to Neon **three times per page request**, and re-transmitted identically on every cursor page. Postgres planners also degrade on very large `IN` lists, often abandoning an index scan for a hash. The same applies to `resolveFacets`'s `coPlayer` rows (`:69-74`), which are unbounded and expand into a per-team-bucket `OR` at `matchArchiveFilters.ts:157-168`.
- **Recommended fix:** Keep the arithmetic in SQL but stop materializing it — a `$queryRaw` returning the whole page (or a CTE the fluent query joins against) avoids the round trip entirely. Failing that, cap the id list and surface the truncation honestly. At minimum, hoist the resolution so it happens once per _search_ rather than once per _page_ — the id set does not change while paging.
- **Tradeoffs / Risks:** Moving the page query to raw SQL loses Prisma's cursor handling, which `:114-117` documents carefully (`gameStart` is not a total order; `id` is the tiebreaker). That comment is correct and must be preserved in any rewrite.
- **Expected impact estimate:** **Likely** high on large archives — measure `IN`-list length at p95 before committing. Trivial on a 50-game archive.
- **Removal Safety:** Needs Verification
- **Reuse Scope:** module

---

### F-11 · Archive totals are recomputed on every page of the same search

- **Category:** DB
- **Severity:** Medium
- **Impact:** 2 extra full aggregate scans per page request
- **Evidence:** `matchArchiveService.ts:110-148` — `archiveTotals(where)` runs unconditionally inside `searchArchive`, including when `cursor` is present. `archiveTotals` itself issues two queries (`:194-203`): an `aggregate` and a separate `count`.
- **Why it's inefficient:** The doc comment at `:182-186` is right that totals must cover the whole filtered set rather than the page — "a win rate that changed as you scrolled would be worse than showing none at all." But that is an argument for computing them **once per search**, not once per page. Paging to page 5 currently runs the same two full-set aggregates five times over an identical `where`.
- **Recommended fix:** Compute totals only when `cursor` is undefined and let the client hold them across pages; or memoize on a hash of the `where`. The second query is also foldable — `_sum` over a `CASE WHEN won THEN 1 END` gives the win count in the same pass as the existing aggregate, halving it to one.
- **Tradeoffs / Risks:** The client must carry the totals across pages. Straightforward with TanStack Query's `select`/`placeholderData`.
- **Expected impact estimate:** **~66% fewer queries** on paged archive requests (3 → 1).
- **Removal Safety:** Likely Safe
- **Reuse Scope:** local file

---

### F-12 · Open-thread polling: full payload + an unconditional write every 5 seconds

- **Category:** DB / Network / Cost
- **Severity:** Medium
- **Impact:** Neon transfer, write volume, Vercel invocations
- **Evidence:** `src/hooks/useThreads.ts:26-34` — `refetchInterval: 5_000` while a thread is open. Server side, `src/domains/marketplace/services/messagingService.ts:132-159`:

  ```ts
  const messages = await prisma.message.findMany({ where: { conversationId }, take: limit /* 100 */, ... });
  await prisma.message.updateMany({                              // ← every poll, unconditionally
    where: { conversationId, senderId: { not: userId }, readAt: null },
    data: { readAt: new Date() },
  });
  ```

- **Why it's inefficient:** **12 requests per minute per open thread**, each doing three queries (membership lookup, 100-message read, mark-read write) and returning the **entire 100-message body payload** even when nothing changed. The `updateMany` is a write transaction issued 12×/min that matches zero rows in the overwhelming majority of cases — WAL, lock acquisition, and replication cost for nothing. `@@index([conversationId, createdAt])` (`schema.prisma:1809`) does not cover the `readAt IS NULL` predicate, so it scans the conversation's full message set each time.
- **Recommended fix:**
  - Accept a `since` / `afterId` param and return only new messages; the client already holds the rest.
  - Guard the write: skip `updateMany` when the fetched page contains no unread message from the other party — the data to decide is already in hand at line 141.
  - Add a partial index: `CREATE INDEX ... ON messages (conversation_id) WHERE read_at IS NULL`.
  - `ADR-016` settled polling-over-sockets and that decision stands; this is about the cost _of each poll_, not the polling.
- **Tradeoffs / Risks:** Incremental fetch needs care around the read-receipt round trip. Low risk; messaging is not on the critical revenue path.
- **Expected impact estimate:** **~90% payload reduction** per poll; near-total elimination of no-op writes.
- **Removal Safety:** Likely Safe
- **Reuse Scope:** module

---

### F-13 · `listThreads` reads every booking for up to 100 pairs to keep one status each

- **Category:** DB
- **Severity:** Medium
- **Impact:** Rows read, query planning
- **Evidence:** `messagingService.ts:99-116`

  ```ts
  const bookings = await prisma.booking.findMany({
    where: {
      OR: rows.map((row) => ({ coachProfileId: row.coachProfileId, studentId: row.studentId })),
    },
    orderBy: { createdAt: "desc" },
    select: { coachProfileId: true, studentId: true, status: true },
  });
  const latest = new Map<string, BookingStatus>();
  for (const booking of bookings) {
    if (!latest.has(key)) latest.set(key, booking.status);
  }
  ```

- **Why it's inefficient:** The comment says "in one query rather than one per row," which is a genuine improvement over an N+1 — but it fetches **all** bookings for those pairs and then throws away everything except the first per pair. A coach with 40 repeat students at 20 sessions each returns 800 rows to produce 40 values. There is no `take`. A 100-branch `OR` also tends to defeat index selection.
- **Recommended fix:** `DISTINCT ON (coach_profile_id, student_id) ... ORDER BY coach_profile_id, student_id, created_at DESC` — the exact query Postgres has a dedicated construct for. Or `groupBy` with `_max: { createdAt }` followed by a targeted fetch. Either reads one row per pair instead of all of them.
- **Tradeoffs / Risks:** `DISTINCT ON` means `$queryRaw`, which CLAUDE.md §2.1 permits with review and documentation. `matchArchiveService.ts:83-91` is the house precedent for documenting one.
- **Expected impact estimate:** Rows read drops from O(total bookings) to O(pairs) — **20× on an active coach** (**Likely**; scales with repeat-booking rate).
- **Removal Safety:** Needs Verification
- **Reuse Scope:** local file

---

### F-14 · No timeout on Riot fetches

- **Category:** Reliability
- **Severity:** Medium
- **Impact:** Function-duration cost, held rate-limit tokens, stuck syncs
- **Evidence:** `src/lib/riot/client.ts:64-77`

  ```ts
  const response = await fetch(url, { headers: { ... }, cache: "no-store" });
  ```

  No `signal`, no `AbortSignal.timeout`. Contrast `src/lib/ai/providers/openai.ts:33` and `anthropic.ts:31`, which both pass `{ signal: AbortSignal.timeout(45_000) }` with the comment _"Prevent Inngest jobs from hanging indefinitely if OpenAI is slow."_ The same reasoning applies to Riot and was not applied.

- **Why it's inefficient:** A stalled connection to Riot holds the invocation until the platform's 300s ceiling. On Vercel's Active-CPU model wall-clock is not the main charge, but the invocation, its memory reservation, and its DB connection are all pinned — and `withRetry` will do it up to 3 times, so one hung endpoint can occupy a function for 15 minutes. During a sync it also stalls every subsequent match in the (currently serial) loop.
- **Recommended fix:** `AbortSignal.timeout(10_000)` on the Riot fetch — Riot p99 is well under 2s — and map `AbortError` to a retryable status so `withRetry` handles it. `RETRYABLE_STATUSES` in `src/lib/riot/retry.ts:4` currently only knows HTTP codes.
- **Tradeoffs / Risks:** A too-aggressive timeout converts slow successes into retries. 10s is comfortably above Riot's real latency distribution.
- **Expected impact estimate:** Bounds worst-case sync duration from ~900s to ~30s.
- **Removal Safety:** Safe
- **Reuse Scope:** service-wide

---

### F-15 · No code splitting anywhere: 0 uses of `next/dynamic` across 665 components

- **Category:** Frontend / Build
- **Severity:** Medium
- **Impact:** First-load JS, LCP, Core Web Vitals
- **Evidence:**
  - `grep -rn "next/dynamic" app src` → **0 results**.
  - 343 of 665 `.tsx` files carry `"use client"`.
  - `recharts` (~400 KB raw / ~110 KB gzip) is statically imported by `src/components/dashboard/DailyMomentumChart.tsx` and `src/domains/teams/components/TeamWinRateTrend.tsx`.
  - `framer-motion` statically imported by 9 components.
  - `lucide-react` imported by **187** files, all in named-import form (`import { Award } from "lucide-react"`).
  - `next.config.mjs` sets **no** `experimental.optimizePackageImports`.
- **Why it's inefficient:** Recharts lands in the shared chunk for any route group whose graph reaches a chart component, and is downloaded and parsed by users who never scroll to a chart. Without `optimizePackageImports`, `lucide-react`'s barrel is re-resolved across 187 import sites — a known Next.js build-time and bundle cost that the flag exists specifically to fix. CLAUDE.md §10 sets a 3s LCP budget for match history; nothing currently defends it.
- **Recommended fix:**
  1. `next.config.mjs`: add
     ```js
     experimental: {
       optimizePackageImports: [
         "lucide-react",
         "recharts",
         "framer-motion",
         "@radix-ui/react-dialog",
       ];
     }
     ```
     — one line, zero behavioural risk, supported in Next 14.2.
  2. `const Chart = dynamic(() => import("./DailyMomentumChart"), { ssr: false, loading: () => <ChartSkeleton /> })` at each chart's usage site. Charts are below the fold and client-only; there is no SSR value to lose.
  3. Consider `serverComponentsExternalPackages: ["@react-pdf/renderer"]` — it is used by exactly one route (`app/api/coaching/reports/[reportId]/pdf/route.ts`) and is a large dependency to bundle into a serverless function.
- **Tradeoffs / Risks:** `ssr: false` on a chart means a skeleton on first paint — the desired behaviour anyway. Verify no chart is above the fold on a landing page.
- **Expected impact estimate:** **~110–160 KB gzip** off first load on chart-bearing routes; measurable build-time improvement from `optimizePackageImports`.
- **Removal Safety:** Safe
- **Reuse Scope:** service-wide

---

### F-16 · Post-sync side effects: 7 unawaited HTTP sends + 12 serial cache-delete round trips

- **Category:** Network / Reliability
- **Severity:** Medium
- **Impact:** Sync tail latency, lost events
- **Evidence:** `matchSyncService.ts:154-160` — seven separate `inngest.send({...}).catch(...)` calls, none awaited, each an HTTP request. Then `:162-168`:

  ```ts
  const positions = ["all", "TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];
  await Promise.all(positions.map((pos) => deleteCached(buildCacheKey("matchup-matrix", { ... }))));
  ```

  and `src/lib/ai/aiCache.ts:68-72` — each `deleteCached` does a Redis `del` **and** a Postgres `deleteMany`.

- **Why it's inefficient:**
  - Inngest's SDK accepts an **array** in a single `send` call. Seven individual HTTP round trips are six more than needed. Because none are awaited, on Vercel they can be cut off when the response returns — events silently lost, which is the opposite of what a durable-execution layer is for.
  - The cache bust is 6 keys × 2 stores = **12 round trips**. They run in parallel so wall-clock is fine, but Upstash REST bills per command and each is a separate HTTPS request. Redis supports pipelining; `aiCache.deleteMany` supports `cacheKey: { in: [...] }` in one statement.
- **Recommended fix:** One `await inngest.send([...])` with the array (conditionally built). Add a `deleteCachedMany(keys: string[])` to `aiCache` doing one pipelined Redis delete plus one `deleteMany({ cacheKey: { in: keys } })`.
- **Tradeoffs / Risks:** Awaiting the batched send adds one round trip to the critical path — worth it for delivery guarantees, and it replaces seven.
- **Expected impact estimate:** 19 round trips → 3. Removes a silent event-loss class.
- **Removal Safety:** Likely Safe
- **Reuse Scope:** module

---

### F-17 · `coachingReport.matchesAnalyzed: { has: ... }` array containment with no GIN index

- **Category:** DB
- **Severity:** Medium
- **Impact:** Match-detail page latency, scales with report table growth
- **Evidence:** `src/domains/match/services/matchService.ts:160-167`

  ```ts
  const aiInsightRow = await prisma.coachingReport.findFirst({
    where: { riotAccount: { userId }, matchesAnalyzed: { has: matchDbId }, status: "complete" },
    ...
  });
  ```

  `schema.prisma:608-638` declares indexes on `[riotAccountId, createdAt]`, `[status]`, `[createdAt]` — **none on `matchesAnalyzed`**.

- **Why it's inefficient:** `has` compiles to `matches_analyzed @> ARRAY[$1]`. Without a GIN index that predicate cannot be indexed at all; Postgres evaluates it row-by-row over whatever the other filters narrow to. Today the `riotAccount: { userId }` join keeps that small. As users accumulate reports it degrades linearly, on a query that sits on the match-detail page load path.
- **Recommended fix:** `@@index([matchesAnalyzed], type: Gin)` in the Prisma schema (supported for scalar-list fields on PostgreSQL). Confirm with `EXPLAIN ANALYZE` on a realistic report volume before adding — an index that is never chosen is pure write overhead.
- **Tradeoffs / Risks:** GIN indexes are expensive to write and to store. Reports are written rarely and read often, so the trade is favourable — but verify the planner actually picks it.
- **Expected impact estimate:** **Likely** — low today, growing. Measure before acting.
- **Removal Safety:** Needs Verification
- **Reuse Scope:** local file

---

### F-18 · `SELECT *` on wide rows in hot read paths

- **Category:** DB / Network
- **Severity:** Low-Medium
- **Impact:** Neon egress (a known past constraint on this project)
- **Evidence:**
  - `src/domains/coaching/services/reportService.ts:69-74` — `getReport` uses `findFirst` with **no `select`**. `CoachingReport` carries `summary`, `strengths`, `weaknesses`, `actionItems`, `championRecommendations`, `coachPersonaResponse` — several large JSON columns pulled whether the caller needs them or not.
  - `matchSyncService.ts:60` — `prisma.riotAccount.findUnique({ where: { id: riotAccountId } })`, no `select`, on every sync.
- **Why it's inefficient:** `aiCache.ts:29-33` shows this project already knows the cost and fixed it there: _"`content` here can be a multi-hundred-KB meta snapshot. Every byte crosses the network from Neon, so only the two fields the caller needs are selected (TASK-282)."_ The same discipline has not reached these call sites.
- **Recommended fix:** Add explicit `select` to both. `listReports` in the same file (`:97-110`) is already the correct model.
- **Tradeoffs / Risks:** `syncRankedSnapshot(account)` takes a full `RiotAccount` — narrowing that one requires checking which fields it reads.
- **Expected impact estimate:** Small per call, meaningful in aggregate on a metered transfer allowance.
- **Removal Safety:** Likely Safe
- **Reuse Scope:** service-wide (worth an audit pass over all 537 Prisma call sites)

---

### F-19 · `computeKDA` reimplemented six times, with three different semantics

- **Category:** Reuse Opportunity
- **Severity:** Low-Medium
- **Impact:** Correctness drift, maintenance cost
- **Evidence:** Canonical implementation at `src/domains/analysis/calculators/performanceCalculator.ts:4`:

  ```ts
  return parseFloat(((kills + assists) / Math.max(deaths, 1)).toFixed(2));
  ```

  Reimplemented at:

  | Location                                           | Formula                                  | Differs how                      |
  | -------------------------------------------------- | ---------------------------------------- | -------------------------------- |
  | `analysis/components/recap/recapChapters.ts:55`    | `deaths > 0 ? (k+a)/deaths : k+a`        | **Different result at 0 deaths** |
  | `creator/services/overlayDataService.ts:130`       | `(k+a)/max(d,1)`, `Math.round(×100)/100` | own rounding                     |
  | `esports/proBuild.ts:265`                          | `(k+a)/max(d,1)`                         | unrounded                        |
  | `esports/services/playerChampionService.ts:10`     | `(k+a)/max(d,1)`                         | unrounded                        |
  | `app/(esports)/esports/players/[slug]/page.tsx:52` | `(k+a)/max(d,1)`                         | unrounded, inline in a page      |

- **Why it's inefficient:** Not a CPU cost — a **drift cost**. The same number is displayed to a user through six code paths, one of which disagrees at a boundary the game actually produces (a deathless game). A future change to the canonical definition silently misses five call sites. `matchArchiveService.ts:183-187` documents a _deliberate_ third semantic (ratio-of-sums for aggregates) with a good reason — that one is correct and should stay, but it should be a named export (`computeAggregateKDA`) rather than an inline divergence.
- **Recommended fix:** Import `computeKDA` at the four unrounded sites. Promote the aggregate variant to a named export alongside it. Fix or document `recapChapters.ts:55` — it is the only genuine behavioural difference.
- **Tradeoffs / Risks:** Adopting the canonical rounding changes displayed values by ≤0.01 in places. Snapshot tests may need updating.
- **Expected impact estimate:** No runtime change. Removes five drift sites.
- **Removal Safety:** Likely Safe
- **Reuse Scope:** service-wide

---

### F-20 · Dead code: `incrementHit`, `isEmptyFilter`, and a no-op Prisma listener

- **Category:** Dead Code
- **Severity:** Low
- **Impact:** Bundle/maintenance surface; one item is actively misleading
- **Evidence:**
  - **`src/lib/ai/aiCache.ts:75-79` — `incrementHit`.** Zero production callers. The only other occurrence of the name in the entire tree is its own comment at `:39` ("incrementHit() remains for callers that genuinely want the telemetry"). There are no such callers, and the comment reads as if there are.
  - **`src/domains/match/services/matchArchiveFilters.ts:178` — `isEmptyFilter`.** Referenced only by `matchArchiveFilters.test.ts`. Its doc comment describes a UI use ("lets the UI tell 'everything' apart from 'nothing matched'") that no component implements.
  - **`src/lib/db/prisma.ts:29`** —
    ```ts
    prisma.$on("query" as never, () => {
      /* no-op, required to attach error handler */
    });
    ```
    The comment is factually wrong: the `$use` middleware below at `:31-45` is what captures pool errors, and it does not depend on this listener. In production `log` is `["error"]`, so no `query` event is ever emitted and the handler never fires. The `as never` cast is the tell.
- **Why it's inefficient:** Each is small, but the middle two carry doc comments asserting a use that does not exist — the most expensive kind of dead code, because a future reader trusts them.
- **Recommended fix:** Delete `incrementHit` and its stale reference in the `getCached` comment. Either implement the `isEmptyFilter` UI use or delete the function and its test. Delete the `$on("query")` line. Separately, note that `prisma.$use` is deprecated in Prisma 5 in favour of `$extends` — worth a migration ticket, not an inline change.
- **Tradeoffs / Risks:** None. Verified by full-tree grep excluding test files.
- **Expected impact estimate:** Negligible runtime; removes three misleading claims.
- **Removal Safety:** **Safe** (all three verified unreferenced in production code)
- **Reuse Scope:** local files

---

### F-21 · `getPopularChampions` re-sorts a 170-champion array on every call across ~739 static pages

- **Category:** CPU
- **Severity:** Low
- **Impact:** Build/ISR-revalidation CPU
- **Evidence:** `src/domains/meta/services/metaStatsService.ts:278-289`

  ```ts
  return [...snapshot.champions] // full copy
    .filter((c) => c.championKey.toLowerCase() !== needle)
    .sort((a, b) => b.overallPickRate - a.overallPickRate) // full sort, result discarded
    .slice(0, limit); // keeps 8
  ```

- **Why it's inefficient:** Copy + filter + full sort of ~170 objects to keep 8. The ordering depends only on the snapshot, which the file's own comment says is stable for 12 hours and consumed by "~739 statically generated pages" on each revalidation wave. The sort is redone for every one of them. `findChampionStats` at `:293-306` is likewise an O(n) linear scan per call where a `Map` built once per snapshot would be O(1).
- **Why it is only Low:** ~170 elements is genuinely cheap. This is listed because the multiplier (739 pages × 2 calls each per wave) is unusual, not because the operation is expensive — and the fix is nearly free.
- **Recommended fix:** Memoize a `sortedByPickRate` array and a `byKey` Map alongside the existing `snapshotMemo` entry, computed once per snapshot load. `excludeKey` is handled by taking `limit + 1` and filtering after the slice.
- **Tradeoffs / Risks:** Slightly more memory per memoized variant — see F-22.
- **Expected impact estimate:** **Likely** small. Do not prioritize above F-01 through F-15.
- **Removal Safety:** Safe
- **Reuse Scope:** local file

---

### F-22 · `snapshotMemo` has no size cap

- **Category:** Memory
- **Severity:** Low
- **Impact:** Per-instance memory
- **Evidence:** `metaStatsService.ts:181` — `const snapshotMemo = new Map<string, {...}>()`, keyed by `${mode}:${tier ?? "default"}`. Entries expire by timestamp on read but are **never removed** — an expired entry keeps its ~200 KB snapshot alive until that variant is read again.
- **Why it's inefficient:** The comment at `:176` says "Each instance holds at most a handful of variants," which is true for today's call sites. But nothing enforces it: `SnapshotMode × SnapshotTier` is a product, and the blob is explicitly large (the file cites a "107.8KB read" for the compressed row). If tier selection is ever exposed to users as a query parameter, per-instance memory becomes user-controlled.
- **Recommended fix:** Cap at ~8 entries with LRU eviction, and drop the entry on expiry rather than leaving it. Same shape as the fix for F-09.
- **Tradeoffs / Risks:** None.
- **Expected impact estimate:** Turns an unbounded-in-principle allocation into a bounded one.
- **Removal Safety:** Safe
- **Reuse Scope:** local file

---

### F-23 · `withRetry` applies no jitter to the `Retry-After` path

- **Category:** Reliability
- **Severity:** Low
- **Impact:** Synchronized retry storms after a 429
- **Evidence:** `src/lib/riot/retry.ts:52-56`

  ```ts
  const exponential = baseDelayMs * Math.pow(2, attempt - 1);
  const jitter = Math.random() * baseDelayMs * 0.5;
  const delay = retryAfterMs ?? Math.min(exponential + jitter, maxDelayMs);
  ```

- **Why it's inefficient:** The exponential branch is correctly jittered; the `retryAfterMs` branch bypasses it entirely. When Riot 429s it returns the _same_ `Retry-After` to every caller — so every blocked request across every instance wakes at the same millisecond and retries in lockstep, reproducing the burst that caused the 429. This compounds F-07.
- **Recommended fix:** `retryAfterMs + Math.random() * 500`.
- **Tradeoffs / Risks:** None.
- **Expected impact estimate:** Smooths the post-429 recovery burst.
- **Removal Safety:** Safe
- **Reuse Scope:** module

---

### F-24 · `middleware.ts` maintains the protected-path list twice

- **Category:** Reuse Opportunity (drift risk)
- **Severity:** Low
- **Impact:** Correctness drift — a security-adjacent one
- **Evidence:** `middleware.ts:5-31` defines `PROTECTED_PATHS` (21 entries); `:65-90` repeats all 21 as `matcher` literals. A path added to one and not the other silently either stops being matched (no auth check runs) or is matched and falls through.
- **Why it's listed as Low rather than fixed-in-place:** Next.js requires `config.matcher` to be **statically analyzable at build time**, so it genuinely cannot be derived from the array at runtime. This is a real framework constraint, not an oversight — the finding is that nothing guards the invariant.
- **Recommended fix:** A unit test asserting every `PROTECTED_PATHS` entry has a corresponding `matcher` entry. Cheap, and it converts a silent auth gap into a failing build.
- **Tradeoffs / Risks:** None.
- **Expected impact estimate:** No runtime change; closes a drift class with security consequences.
- **Removal Safety:** Safe
- **Reuse Scope:** local file

---

### F-25 · Confirm the pooler URL actually carries its connection parameters

- **Category:** DB / Reliability
- **Severity:** Low (verification item)
- **Impact:** Connection-pool exhaustion under the concurrency F-02 introduces
- **Evidence:** `src/lib/db/prisma.ts:9-13`

  ```ts
  // Serverless functions are short-lived; connection_limit=1 prevents pool exhaustion
  // because pgbouncer handles multiplexing at the database layer.
  const url = process.env.DATABASE_POOLER_URL ?? process.env.DATABASE_URL;
  ```

  Nothing in the code sets `connection_limit` or `pgbouncer=true`. The comment describes a property of the **environment variable's value**, which is not verifiable from the repository.

- **Why this matters now:** F-02 raises per-invocation DB concurrency from 1 to 5–8. If `DATABASE_POOLER_URL` is unset in some environment, `DATABASE_URL` is used directly and that change multiplies direct connections rather than pooled ones. The `$use` middleware at `:31-45` already watches for `P2024` (pool timeout), which suggests this has been felt before.
- **Recommended fix:** Assert the invariant at startup — log or fail if the resolved URL lacks `pgbouncer=true`, in the spirit of `redisCache.ts:29-38`'s warn-once-on-misconfiguration pattern. Do this **before** landing F-02.
- **Tradeoffs / Risks:** None.
- **Expected impact estimate:** Prevents a regression rather than delivering a gain.
- **Removal Safety:** Safe
- **Reuse Scope:** service-wide

---

## 3) Quick Wins (Do First)

Ordered by impact ÷ effort. Every one is a small, single-purpose change — each should be its own commit per CLAUDE.md §1.2.

| #   | Finding   | Change                                                          | Effort  | Impact                             |
| --- | --------- | --------------------------------------------------------------- | ------- | ---------------------------------- |
| 1   | **F-03**  | Collapse the 100-iteration `updateMany` loop into one statement | ~15 min | **~2.5s off every sync**           |
| 2   | **F-15a** | Add `experimental.optimizePackageImports` to `next.config.mjs`  | ~5 min  | Bundle + build time, one line      |
| 3   | **F-14**  | `AbortSignal.timeout(10_000)` on the Riot fetch                 | ~15 min | Bounds worst case 900s → 30s       |
| 4   | **F-08**  | Wrap `getMatchTimeline` in the existing `dedup()`               | ~10 min | Halves multi-MB timeline transfers |
| 5   | **F-23**  | Jitter the `Retry-After` branch                                 | ~5 min  | Smooths 429 recovery               |
| 6   | **F-20**  | Delete `incrementHit`, `isEmptyFilter`, `$on("query")` no-op    | ~15 min | Removes 3 misleading comments      |
| 7   | **F-01**  | Fix the `personalCounterService` column names (LA-38)           | ~30 min | **Broken → working**               |
| 8   | **F-18**  | Add `select` to `getReport` and the sync's `riotAccount` read   | ~15 min | Neon egress                        |
| 9   | **F-11**  | Skip `archiveTotals` when `cursor` is set                       | ~20 min | 3 queries → 1 per paged request    |
| 10  | **F-24**  | Test asserting `PROTECTED_PATHS` ↔ `matcher` parity             | ~20 min | Closes an auth drift class         |

**Roughly two hours of work covers items 1–6 and 8**, and items 1, 3 and 4 alone measurably improve the product's slowest operation.

---

## 4) Deeper Optimizations (Do Next)

**A. Rebuild the sync pipeline — F-02, F-04, F-05, F-16.**
Treat these as one project, not four tickets. Introduce a shared bounded-concurrency helper (`src/lib/utils/`, per CLAUDE.md §4), apply it to the ingest loop, move rank enrichment and the backfill sweep onto durable Inngest steps, and batch the post-sync event sends. The pieces are individually shippable, but the sequencing matters: F-02 without F-04 raises the fan-out ceiling rather than lowering it. **Do F-04 first, then F-02.**
_Combined estimate: 40s → 6s on a Pro sync, ~10× fewer peak Riot requests._

**B. Make rate limiting global — F-07.**
Move the token bucket to Upstash. `@upstash/ratelimit` is already a dependency and `rateLimitBackends.ts` already exists. Fix the reservation race in the in-process bucket regardless — that is a local ~15-line fix and is worth doing even if the Redis migration is deferred. Should follow A, since A changes the concurrency profile the limiter has to handle. Warrants an ADR.

**C. Introduce code splitting as a practice — F-15.**
Not a one-off. Establish `next/dynamic` for below-the-fold client trees, add a bundle-size check to CI, and set a first-load budget consistent with CLAUDE.md §10's 3s LCP target. Starting with the two Recharts components gives the measurement a baseline.

**D. Give the archive a single-query path — F-10, F-11.**
The two-phase resolve-then-filter design is a reasonable way to stay inside the Prisma fluent API, and the file argues for it well. It stops paying off once the id sets get large. A CTE-based `$queryRaw` for the filtered page would remove the round trip and the giant `IN` list — but it must preserve the `(gameStart, id)` cursor ordering that `matchArchiveService.ts:114-117` documents. Needs an ADR and a measurement of real p95 `IN`-list length first; do not start here.

**E. Cache-layer hardening — F-09, F-22, and stampede protection.**
Bound both in-memory maps. Separately, neither `aiCache` nor the meta snapshot has single-flight protection: N concurrent misses all compute. `dedup()` in `src/lib/riot/dedup.ts` is exactly the primitive needed and is already written — generalizing it to the AI cache is a small, high-leverage change. Also consider negative caching in `getCached`, so a miss does not cost a Postgres round trip every time (F-01's empty path is the pathological case).

**F. Systematic `select` audit — F-18.**
537 Prisma call sites; two were spot-checked and both were unbounded. An ESLint rule requiring explicit `select`/`include` on `findUnique`/`findFirst` would prevent recurrence better than a one-time sweep.

---

## 5) Validation Plan

### Before changing anything — establish the baseline

Everything below assumes a baseline exists. Without one, "it feels faster" is the only available verdict.

1. **Enable Prisma query logging in a staging environment** and capture a full `syncAccount` run for a 100-match account. Count statements and sum durations. Expect the F-03 loop to show ~100 near-identical `UPDATE ... WHERE riotAccountId IS NULL` statements each affecting 0 rows — that is the confirmation before the fix and the proof after it.
2. **Instrument `syncAccount` end-to-end.** Log wall-clock, `newCount`, Riot call count, and DB statement count. The existing `logger.info` at `matchSyncService.ts:170` is the natural place to extend.
3. **Capture `IN`-list length for F-10.** Log `kdaParticipantIds.length` at p50/p95 from real archives. If p95 is under ~200 ids, deprioritize F-10 entirely — the finding is real but not worth the ADR.
4. **`next build` output** — record first-load JS per route before touching F-15.
5. **Neon dashboard** — rows read/written per hour and egress, as the baseline for F-10, F-12, F-13 and F-18.

### Per-finding verification

| Finding   | How to verify                                                                  | Metric                        | Target                     |
| --------- | ------------------------------------------------------------------------------ | ----------------------------- | -------------------------- |
| F-01      | Integration test hitting a seeded DB — this class of bug is invisible to `tsc` | Query succeeds                | Non-throwing, correct rows |
| F-02      | Timed sync, 100-match fixture                                                  | Wall-clock                    | ~40s → <8s                 |
| F-03      | Prisma query log statement count                                               | Statements/sync               | ~100 → 1                   |
| F-04      | Count in-flight Riot requests during sync                                      | Peak concurrency              | ~500 → <20                 |
| F-05      | Sync duration with/without the backfill block                                  | Wall-clock delta              | −20s                       |
| F-06      | Load a match with an unnameable participant twice; count Riot calls            | Calls per view                | Unbounded → 1 total        |
| F-07      | Load test: 50 concurrent syncs                                                 | 429 rate                      | Near zero                  |
| F-08      | Sync a match with 2 tracked players; count timeline fetches                    | Fetches/match                 | 2 → 1                      |
| F-09/F-22 | Heap snapshot after 1000 syncs on a warm instance                              | RSS growth                    | Bounded, plateaus          |
| F-11      | Query log on archive page 5                                                    | Queries/request               | 3 → 1                      |
| F-12      | Network tab, thread open 5 min                                                 | Bytes transferred             | −~90%                      |
| F-13      | `EXPLAIN ANALYZE` on `listThreads`' booking query                              | Rows read                     | O(pairs) not O(bookings)   |
| F-15      | `next build`                                                                   | First-load JS on `/dashboard` | −110 KB+ gzip              |
| F-17      | `EXPLAIN ANALYZE` before _and_ after adding the GIN index                      | Plan node                     | Index scan, not seq scan   |

### Correctness preservation — non-negotiable

Per CLAUDE.md §5, none of these ship without their test. The ones that genuinely could break something:

- **F-02 (concurrency):** assert `newCount`, `skipped`, and `errors` are identical to the serial run for the same fixture. Ordering of `seenPlayers` must not matter — verify `indexPlayers` is order-independent (it groups by `occurrences`, so it should be, but assert it).
- **F-03 (collapsed update):** assert the same participant rows get `riotAccountId` set. Test the second-sync case explicitly — that is the one currently doing 100 no-ops.
- **F-10 (archive):** the existing cursor-stability property must hold. `matchArchiveService.ts:114-117` explains why `id` is the tiebreaker; any rewrite needs a test that two games starting in the same second page consistently.
- **F-12 (incremental fetch):** read receipts must still land. Test: A sends, B opens, A sees `readAt` set.
- **F-19 (KDA):** golden-value test across all six call sites _before_ consolidating, so the ≤0.01 display shifts are seen rather than discovered.

Per CLAUDE.md §5.4, AI-pipeline tests must still cover happy path, API error, malformed data, and cache hit — F-16's batching touches the event path feeding them.

### Load testing

Once A and B land, run 50 concurrent syncs against a staging Riot key and watch: 429 rate, p95 sync duration, Neon connection count (`P2024` in Sentry — the `$use` handler at `prisma.ts:31-45` already reports it), and peak instance memory. That single test exercises F-02, F-04, F-05, F-07, F-14 and F-25 together, which is the only way to see how they interact.

---

## 6) Optimized Code / Patch

Reference implementations for the highest-ROI items. **None of these have been applied** — they are illustrative, and each needs its own task, commit, and test per CLAUDE.md §1 and §3.

---

### F-03 — collapse the no-op update loop

**`src/domains/riot/services/matchSyncService.ts:126-133`**

```diff
-  // Link existing matches to our user's participant
-  for (const [riotMatchId, dbMatchId] of existingByRiotId) {
-    if (!matchIds.includes(riotMatchId)) continue;
-    await prisma.matchParticipant.updateMany({
-      where: { matchId: dbMatchId, puuid: account.puuid, riotAccountId: null },
-      data: { riotAccountId: account.id },
-    });
-  }
+  // Link existing matches to our user's participant.
+  //
+  // One statement, not one per match: every key in existingByRiotId came from a query already
+  // scoped to `matchId: { in: matchIds }`, so the per-match guard could never be false, and the
+  // predicates differed only by matchId. On a returning user this ran ~100 times and matched zero
+  // rows every time — `riotAccountId: null` is satisfiable only once per account per match.
+  const knownMatchDbIds = [...existingByRiotId.values()];
+  if (knownMatchDbIds.length > 0) {
+    await prisma.matchParticipant.updateMany({
+      where: { matchId: { in: knownMatchDbIds }, puuid: account.puuid, riotAccountId: null },
+      data: { riotAccountId: account.id },
+    });
+  }
```

**What changed:** ~100 sequential round trips → 1. The dropped `matchIds.includes()` guard was provably always true (see F-03 evidence). Predicate set is unchanged, so the rows affected are identical.

---

### F-02 — bounded-concurrency ingest

**New: `src/lib/utils/concurrency.ts`** (~30 lines, well inside the 150-line utility limit in CLAUDE.md §3.3)

```ts
/**
 * Runs `worker` over `items` with at most `limit` in flight.
 *
 * Bounded rather than `Promise.all`: the Riot limiter is a fixed budget shared with every other
 * caller in the process, and an unbounded fan-out spends it all at once — which is what made the
 * per-match rank enrichment a 429 source. Results keep input order regardless of completion order.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });

  await Promise.all(runners);
  return results;
}
```

**`matchSyncService.ts:88-118`** — the loop becomes:

```ts
// Eight at a time: the limiter allows 20 req/s and each match is one Riot call plus a short
// transaction, so this keeps the bucket usefully busy without letting a 100-match sync open a
// hundred Postgres transactions at once.
const INGEST_CONCURRENCY = 8;

const outcomes = await mapWithConcurrency(newMatchIds, INGEST_CONCURRENCY, async (riotMatchId) => {
  try {
    const dto = await getMatch(riotMatchId, account.region);
    const matchDbId = randomUUID(); // hoisted to a top-level import
    const mapped = mapMatch(dto, matchDbId, account.puuid, account.id);
    if (!mapped) return { skipped: true as const };

    await prisma.$transaction(async (tx) => {
      await tx.match.create({ data: mapped.match });
      await tx.matchParticipant.createMany({ data: mapped.participants });
    });

    return { skipped: false as const, matchDbId, mapped };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn(`[sync] Failed for match ${riotMatchId}: ${msg}`);
    return { error: `${riotMatchId}: ${msg}` };
  }
});
```

**What changed:**

- Serial → 8-way concurrent. The per-item `try/catch` stays _inside_ the task so one bad match still cannot fail the run.
- `const { randomUUID } = await import("crypto")` moved out of the loop body to a module-level import — it was a dynamic import executed once per iteration.
- Rank enrichment is **deliberately not** in this snippet: per F-04 it should move to Inngest rather than be made concurrent in place. Landing F-02 without F-04 raises the fan-out ceiling to 8 × 500.

---

### F-04 / F-16 — batch the post-sync events, defer rank enrichment

**`matchSyncService.ts:154-160`**

```diff
-  if (newCount >= 3) inngest.send({ name: "match/session.synced", data: {...} }).catch(...);
-  inngest.send({ name: "tilt/check-streak", data: {...} }).catch(...);
-  inngest.send({ name: "achievement/check", data: {...} }).catch(...);
-  if (newCount > 0) inngest.send({ name: "timeline/fetch-for-account", data: {...} }).catch(...);
-  inngest.send({ name: "challenge/check-progress", data: {...} }).catch(...);
-  inngest.send({ name: "snapshot/compute", data: {...} }).catch(...);
-  if (newCount > 0) inngest.send({ name: "academy/check-assignments", data: {...} }).catch(...);
+  // One send, and awaited. Seven unawaited sends were seven HTTP round trips that Vercel could
+  // terminate when the response returned — silently dropping the durable work they exist to start.
+  const events = [
+    { name: "tilt/check-streak",        data: { riotAccountId: account.id, userId: account.userId } },
+    { name: "achievement/check",        data: { riotAccountId: account.id, userId: account.userId } },
+    { name: "challenge/check-progress", data: { riotAccountId: account.id, userId: account.userId } },
+    { name: "snapshot/compute",         data: { riotAccountId: account.id } },
+    ...(newCount >= 3 ? [{ name: "match/session.synced", data: { riotAccountId: account.id } }] : []),
+    ...(newCount > 0 ? [
+      { name: "timeline/fetch-for-account", data: { riotAccountId: account.id } },
+      { name: "academy/check-assignments",  data: { riotAccountId: account.id, userId: account.userId } },
+      // Rank enrichment moves here from inside the ingest loop, where it fanned out unbounded and
+      // unawaited — up to 50 concurrent chains of 10 serial Riot calls each, contending with the
+      // ingest's own calls at the same token bucket.
+      { name: "match/enrich-ranks", data: { riotAccountId: account.id, region: account.region } },
+    ] : []),
+  ];
+  await inngest.send(events).catch((err) => logger.warn("[sync] Event dispatch failed", err));
```

**What changed:** 7 HTTP round trips → 1, awaited so the events are actually delivered. Rank enrichment becomes a durable step with its own retry semantics instead of orphaned in-request work. A new `match/enrich-ranks` handler is required in `src/inngest/` — it should apply `mapWithConcurrency` internally and can then replace the `unrankedMatches` backfill block (F-05) entirely.

---

### F-14 + F-23 — timeout and jitter

**`src/lib/riot/client.ts:66-71`**

```diff
   const response = await fetch(url, {
     headers: { ... },
     cache: "no-store",
+    // Riot p99 is well under 2s. Without a bound, a stalled connection pins the invocation, its
+    // memory reservation and its DB connection until the 300s platform ceiling — three times over,
+    // because withRetry will try again. The AI providers already do this (openai.ts:33).
+    signal: AbortSignal.timeout(10_000),
   });
```

**`src/lib/riot/retry.ts:55`**

```diff
-  const delay = retryAfterMs ?? Math.min(exponential + jitter, maxDelayMs);
+  // Jitter both branches. Riot returns the same Retry-After to every 429'd caller, so an unjittered
+  // honouring of it wakes them all in the same millisecond and rebuilds the burst that caused it.
+  const delay = retryAfterMs !== undefined
+    ? retryAfterMs + Math.random() * 500
+    : Math.min(exponential + jitter, maxDelayMs);
```

Also add `AbortError` to the retryable set in `retry.ts:4` — it is currently HTTP-status-only, so a timeout would propagate as a hard failure instead of being retried.

---

### F-15 — bundle

**`next.config.mjs`** — inside `nextConfig`:

```js
  experimental: {
    // lucide-react is imported by 187 files in named-import form; without this the barrel is
    // re-resolved at each site. recharts and framer-motion are large and used by few components.
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion", "@radix-ui/react-dialog"],
  },
```

**Chart usage sites:**

```tsx
import dynamic from "next/dynamic";

// Recharts is ~110KB gzip and this chart is below the fold on every route that renders it.
// ssr: false because it is client-only anyway — there is no server render to lose.
const DailyMomentumChart = dynamic(
  () => import("@/components/dashboard/DailyMomentumChart").then((m) => m.DailyMomentumChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
```

`.then((m) => m.DailyMomentumChart)` because CLAUDE.md §3.1 requires named exports.

---

### F-01 — column names (LA-38)

**`src/domains/counter/services/personalCounterService.ts:48-70`** — the shape of the fix:

```diff
     SELECT
-      opp.champion_id         AS opponent_champion_id,
-      opp.champion_name       AS opponent_champion_name,
+      opp."championId"        AS "opponentChampionId",
+      opp."championName"      AS "opponentChampionName",
       COUNT(*)::bigint        AS games,
-      SUM(CASE WHEN mp.won THEN 1 ELSE 0 END)::bigint AS wins,
+      SUM(CASE WHEN mp."won" THEN 1 ELSE 0 END)::bigint AS wins,
     FROM match_participants mp
     JOIN match_participants opp
-      ON  opp.match_id  = mp.match_id
-      AND opp.team_id  != mp.team_id
-      AND opp.position  = mp.position
-    JOIN matches m ON m.id = mp.match_id
-    WHERE mp.riot_account_id = ${riotAccountId}::uuid
-      AND mp.champion_id     = ${championId}
-      AND m.queue_type       = 'RANKED_SOLO_5x5'
+      ON  opp."matchId"  = mp."matchId"
+      AND opp."teamId"  != mp."teamId"
+      AND opp."position" = mp."position"
+    JOIN matches m ON m."id" = mp."matchId"
+    WHERE mp."riotAccountId" = ${riotAccountId}::uuid
+      AND mp."championId"    = ${championId}
+      AND m."queueType"      = 'RANKED_SOLO_5x5'
```

The `MatchupRow` interface at `:14-22` and `rowToEntry` at `:92-108` must be renamed to match the new aliases.

**Two further issues in the same file, worth folding into the same task:**

1. **The empty path never caches** (`:127-137`) — `return empty` without `setCached`. So an account with no qualifying matchups re-runs the full self-join on every request, forever. This is exactly the case that is _most_ common for new users. Add the `setCached` call before returning.

2. **`avgKda` double-counts assists** (`:88` vs `:104`). The query computes `SUM(mp.kills + mp.assists) AS kills_sum` — assists are _already_ in it — and `rowToEntry` then computes `(row.kills_sum + row.assists_sum) / deaths / games`. Assists are added twice, and dividing a ratio-of-sums by `games` is not an average KDA under any definition used elsewhere in the codebase (compare `archiveTotals`' documented ratio-of-sums at `matchArchiveService.ts:183-187`). The `assists_sum` column is also then redundant work in the aggregate. Since the query has never successfully run, this has never been observed — but it will be wrong the moment F-01's rename lands, which is the reason to fix both together.

---

### F-20 — dead code removals

```diff
--- src/lib/ai/aiCache.ts
-  // Deliberately no hitCount increment. It used to fire on every read, which
-  // turned each cache *hit* into an extra write round trip — the exact opposite
-  // of what a cache is for, and a meaningful slice of the egress that exhausted
-  // the Neon transfer quota. incrementHit() remains for callers that genuinely
-  // want the telemetry.
+  // Deliberately no hitCount increment. It used to fire on every read, which turned each cache
+  // *hit* into an extra write round trip — the exact opposite of what a cache is for, and a
+  // meaningful slice of the egress that exhausted the Neon transfer quota.
   return entry.content;

-export async function incrementHit(cacheKey: string): Promise<void> {
-  await prisma.aiCache
-    .update({ where: { cacheKey }, data: { hitCount: { increment: 1 } } })
-    .catch(() => undefined);
-}

--- src/lib/db/prisma.ts
-// Monitor connection pool exhaustion in Sentry so we can detect when
-// Neon pooler limits are hit across concurrent function invocations.
-prisma.$on("query" as never, () => { /* no-op, required to attach error handler */ });
-
+// Monitor connection pool exhaustion in Sentry so we can detect when Neon pooler limits are hit
+// across concurrent function invocations.
 prisma.$use(async (params, next) => {
```

The `$on("query")` line's comment claims it is "required to attach error handler". It is not — `$use` below is independent of it, and in production `log` is `["error"]` so the `query` event is never emitted. The `as never` cast exists only to silence the type error that would otherwise flag it.

`isEmptyFilter` (`matchArchiveFilters.ts:178`) is left for a decision rather than patched here: its doc comment describes a UI behaviour nobody built. Either build it or delete the function together with its test block.

---

## Appendix — what would raise confidence

Static reading proves the _structure_ of every finding above. It cannot prove magnitude. The following would convert the **Likely** labels into numbers:

| Want to confirm               | Need                                                          |
| ----------------------------- | ------------------------------------------------------------- |
| F-02/F-05 sync latency claims | One timed production `syncAccount` trace, 100-match account   |
| F-07 429 rate                 | Riot API error-rate metric, or a 429 count in Sentry          |
| F-09/F-22 memory growth       | Per-instance RSS over a warm instance's lifetime              |
| F-10 `IN`-list size           | p95 of `kdaParticipantIds.length` on real archives            |
| F-13 booking-row volume       | Distribution of bookings per (coach, student) pair            |
| F-15 bundle numbers           | `next build` route-level first-load JS                        |
| F-17 index value              | `EXPLAIN ANALYZE` at realistic report volume                  |
| F-25 pooler config            | The actual value of `DATABASE_POOLER_URL` in each environment |

Two things are worth stating plainly about scope.

First, this audit read the hot paths — Riot ingest, match archive, messaging, meta snapshot, AI cache, and the frontend bundle — not all 1671 files. The AI coaching pipeline itself (`src/domains/coaching/`), the esports ingest, and the academy/quiz domains got only a survey pass, and the `select`-discipline problem in F-18 was found by spot-check rather than sweep, so more of it almost certainly exists.

Second, the caching work already in this codebase is genuinely strong, and several findings above (F-08, F-14, F-16) are not new problems so much as an existing good pattern that has not yet been applied everywhere it belongs — `getMatch` has `dedup()` and the timeline does not; the AI providers have timeouts and the Riot client does not. Those are the cheapest fixes in the document precisely because the decision has already been made and written down.
