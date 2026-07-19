# TASK-227 — "No match data" after connecting: don't cache an empty match-id list

## Status: In Progress

## Problem

A freshly-connected account (kaanproak0#TR1, on Riot's new PUUID-only system) showed "No match data
yet" despite having matches. Dev-log root cause: at connect/sync time Riot's
`match/v5/matches/by-puuid/{puuid}/ids` returned an **empty array** (transient — match-v5 list lags
right after linking for new-PUUID accounts), the sync completed "+0 new", and `getMatchIds` **cached
that empty `[]` for 60s** (`riotClient.get` caches any successful result, including `[]`). So a
"Sync Now" within the TTL kept hitting the cached empty. Verified: the raw Riot API (same URL, same
headers, `count=100`) now returns 100 match ids for that PUUID.

## Fix

Don't cache an empty-array result for match-id lookups. A transient empty then can't stick for the
TTL, so the next sync immediately refetches and picks up the matches once Riot returns them.

- `riotClient.get` gains a `noCacheEmptyArray` option.
- `getMatchIds` passes it.

Ranked/other data is unaffected (still cached).

## Deliverables

- `src/lib/riot/client.ts`: `noCacheEmptyArray` option.
- `src/domains/riot/services/riotApiClient.ts`: `getMatchIds` sets it.
- `src/lib/riot/client.test.ts`: assert an empty array isn't cached when the flag is set.

## Verification

Unit test (empty not cached, non-empty cached). Manually: re-sync the account → matches load
(Riot now returns them; no stale empty in the way).
