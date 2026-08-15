# TASK-308 — Player search index

## Goal

Make every Riot ID we have ever seen searchable by prefix, so the search box can autocomplete
while a player types. This is the data layer for TASK-309's search bar; nothing user-facing
ships here.

## Key insight

Riot has no name-search endpoint — `account-v1` needs an exact `gameName` **and** `tagLine`, so
autocomplete against Riot is impossible for anyone, not just us. But we already store all ten
participants of every synced match (`matchMapper.ts:145`), nine of whom are nobody's connected
account. The index we need is a by-product of syncs we already run. See
[ADR-017](../adr/ADR-017-player-search-index.md).

## Change

- **Schema** — `PlayerIndex` (`player_index`), one row per `puuid`. Migration
  `20260816000001_add_player_index`. Both indexes use `text_pattern_ops`, which is what lets
  `LIKE 'fak%'` use an index instead of scanning.
- `src/lib/riot/riotId.ts` — `sanitizeRiotIdPart` (moved out of `accountService`, which now
  imports it) and `parseSearchQuery`, which turns a half-typed `Name#TAG` into a prefix pair.
- `src/domains/riot/services/playerSearch.ts` — pure ranking. No database, no Prisma.
- `src/domains/riot/services/playerIndexService.ts` — `indexPlayers` and `searchPlayers`.
- `src/domains/riot/services/matchSyncService.ts` — collects participants across the run and
  indexes them once at the end.
- `src/domains/riot/services/accountService.ts` — indexes a newly connected account immediately,
  so it is searchable before its first sync finishes. This row also carries a summoner level and
  profile icon, which participant rows do not.
- `scripts/backfillPlayerIndex.ts` + `npm run backfill:player-index` — one-time walk of match
  history that predates this task.
- `docs/DATABASE_SCHEMA.md`, `docs/adr/ADR-017-player-search-index.md`.

## Two decisions worth the words

**Writes are bulk.** Prisma has no bulk upsert and a first-time sync carries several hundred
distinct players, so a per-row upsert would put hundreds of round trips inside the sync path.
`indexPlayers` runs one read, one `createMany`, one `updateMany` per distinct appearance count,
and a per-row write only for a player who has changed their Riot ID — normally none.

**`seenCount` counts appearances, not syncs.** A player in thirty of your matches gets +30, not
+1. That is the ranking signal, and collapsing it would make a regular duo rank the same as a
stranger from one game.

## A deliberate limit

The index only knows players who have shared a match with one of our users. Someone on a server
we have never touched is invisible to autocomplete. TASK-309 covers this with an exact-Riot-ID
row that resolves against Riot directly when the index has no hit — so an incomplete index
degrades autocomplete instead of blocking search.

## Tests

`playerSearch.test.ts` — query parsing (tag splitting, directional-character junk, too-short
queries) and ranking (exact name beats a more-popular prefix match, exact name+tag beats exact
name, ties break stably so the list does not reshuffle between keystrokes).

`playerIndexService.test.ts` — appearance counting, the grouping that keeps statement count flat,
participants with no Riot ID skipped, renamed players rewritten, and a database failure returning
0 rather than throwing: search coverage must never fail a match sync.

Neither test touches a database. The prefix behaviour that only Postgres can answer was verified
against the local database instead: `backfill:player-index` wrote 815 players from seeded match
history, `searchPlayers("ka")` returned mixed-case hits (`KAE#BTW`, `Kaguya#Lowq`),
`searchPlayers("kaanproak0#TR1")` resolved to exactly one, and a nonsense prefix returned none.

## Noted, not fixed

`prisma migrate dev` wants to emit ~20 tables of unrelated drift — dropped columns, dropped
indexes, altered defaults — because the hand-written migrations have diverged from
`schema.prisma`. The migration committed here was reduced to only the `player_index` statements.
The drift is pre-existing and needs its own task.

refs TASK-308
