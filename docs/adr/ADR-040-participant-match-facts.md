# ADR-040: Carry queue and game start on the participant row

## Status: Accepted

## Context

Almost everything this product computes about a player is some form of "their last N
ranked games". In Prisma that is written the only way the schema allowed:

```ts
prisma.matchParticipant.findMany({
  where: { puuid, match: { queueType: "RANKED_SOLO_5x5", gameStart: { gte: since } } },
  orderBy: { match: { gameStart: "desc" } },
  take: 20,
});
```

The shape appears at 75 read sites across the analysis, champions, coaching and academy
domains; 43 of them order through the relation.

Both the filter and the sort key live on `matches`, not on `match_participants`. No index
on `match_participants` can serve a sort by a column in another table, so Postgres has one
option: walk `matches` backwards on `matches_gameStart_idx`, and for each match probe its
ten participant rows and discard the nine that are not ours. The work is proportional to
how far back it has to walk, which is proportional to how much history the account has —
so this gets worse over a player's lifetime, not better.

Measured on `lolai_dev` inside a rolled-back transaction, 20,000 matches / 200,000
participant rows, one account holding 2,973 of them, `EXPLAIN (ANALYZE, BUFFERS)` for the
twenty most recent ranked games:

| Shape                                                    | Buffers | Execution    |
| -------------------------------------------------------- | ------- | ------------ |
| Through `matches` — nested loop, ten rows discarded each | 532     | 0.584 ms     |
| `match_participants_puuid_queueType_gameStart_idx`       | **23**  | **0.035 ms** |

A larger synthetic run (600,000 rows) put the same two shapes at 4,699 and 18 buffers. The
number that matters is not the ratio at any one size — it is that the first row grows with
the table and the second does not.

**This is not the Neon transfer problem** (TASK-282, ADR-013, ADR-014), and it is worth
saying so plainly because the two are easy to conflate. Buffers are server-side I/O. Both
shapes return the same twenty rows over the wire. What this fixes is query time and
database CPU, not egress.

## Decision

Copy the parent match's `queueType` and `gameStart` onto `match_participants`, and index
`(puuid, queueType, gameStart DESC)`.

Denormalisation is normally the wrong answer because the copy drifts from its source. It
cannot drift here: a `matches` row is written exactly once, by the ingest transaction in
`matchSyncService.ts`, and never updated — there is no `match.update` or `match.upsert`
anywhere in the codebase. The parent is immutable, so the copy is a snapshot of something
that will never change.

`matchMapper.mapParticipant()` is the single place participant rows are built, so the write
path is one function and cannot be forgotten at a second call site.

### Why one migration rather than a backfill script

`20260824120000_participant_match_facts` adds the columns, fills them from `matches`, sets
them `NOT NULL` and creates the index — in that order, in one file. The alternative, ship
nullable columns and backfill later, leaves a window in which a reader that has already
switched to the new columns silently sees fewer rows than it should. There is no such
window here: either the migration ran and the columns are complete, or it did not and the
old code is still deployed.

The cost is that the migration rewrites the table under an `ACCESS EXCLUSIVE` lock.
Migrations have not run inside the build since ADR-012 — they are their own release step —
so this is something to schedule, not something that can surprise a deploy.

## Consequences

- Two columns of duplicated data per participant row: an enum and a timestamp, about twelve
  bytes, against a row that already carries forty columns including an item array.
- One more index to maintain on write. Ingest writes ten rows per match in a `createMany`;
  this is not a write-heavy table relative to how often it is read.
- Read sites must be migrated to the new columns to get any benefit. Eight hot ones move
  with this change; the rest keep working exactly as before, because the relation filter is
  still valid — it is just slower. That is a deliberate property: this ADR does not require
  a flag day.
- If `matches` ever becomes mutable, this decision is void and the copy must be maintained
  or dropped. That is the invariant to protect.
