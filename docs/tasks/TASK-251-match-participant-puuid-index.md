# TASK-251 — Missing index on MatchParticipant.puuid

## Problem
`match_participants` is the largest table in the schema (one row per player per match, so ~10 rows
per match) and `puuid` is the single most-queried column on it — **73 queries** across
`src/domains/`, `src/inngest/` and `app/api/` filter on it:

```
src/domains/analysis/services/achievementService.ts:19,30,54,88,99,125
src/domains/champions/services/championStatsService.ts:71
src/domains/analysis/services/matchupService.ts:44
src/domains/analysis/services/heatmapService.ts:83
src/domains/analysis/services/recapService.ts:76
src/inngest/functions/tiltStreakCheck.ts:26
… 60+ more
```

`prisma/schema.prisma` declares three indexes on the model and **none of them covers `puuid`**:

```prisma
@@index([matchId])
@@index([riotAccountId, matchId])
@@index([riotAccountId, championId])
```

Postgres therefore sequential-scans the whole table for every one of those queries. It is fast today
only because the table is small; it degrades linearly with total matches stored across **all** users,
not per user — so it gets slower for everyone as the product grows.

## Why `riotAccountId` does not already cover this
`riotAccountId` is nullable (`String? @db.Uuid`) and is only set for participants belonging to a
connected account. The other nine participants in each match carry a `puuid` with a null
`riotAccountId`. Queries that analyse opponents, or that resolve a player before their account row is
linked, must go through `puuid` — which is exactly why 73 call sites use it.

## Change
`prisma/schema.prisma` — add to `MatchParticipant`:

```prisma
@@index([puuid])
```

Plus migration `prisma/migrations/20260720000002_add_match_participant_puuid_index/migration.sql`.

Many of the hot queries pair `puuid` with an `orderBy` on the joined `match.gameStart`, which
Postgres cannot serve from a single-table index anyway; the win here is turning the seq-scan that
*finds* the rows into an index lookup. A composite `[puuid, matchId]` was considered and rejected —
it does not help the join order and doubles write cost on the app's highest-insert-rate table.

## Deployment note
The migration uses a plain `CREATE INDEX`, which takes an `ACCESS EXCLUSIVE` lock for the duration of
the build. That is the right trade-off while the table is still small. If this ships after the table
has grown past a few million rows, switch to `CREATE INDEX CONCURRENTLY` and run it outside the
Prisma migration transaction — Prisma wraps migrations in a transaction and `CONCURRENTLY` is not
allowed inside one.

## Verification
`npx prisma validate` and `npx prisma migrate diff` confirm the migration matches the schema.
After applying: `EXPLAIN ANALYZE` on a `puuid` filter should report `Index Scan using
match_participants_puuid_idx` instead of `Seq Scan on match_participants`.

refs TASK-251
