# TASK-296: Every player reads as unranked — rank lookup still goes via summonerId

## Symptom

The landing preview and the public profile page showed "No Ranked" for players who
have a rank. The signed-in dashboard never recorded a ranked snapshot for any
account that had a `summonerId` stored.

## Root cause

Riot removed the encrypted summoner `id` from Summoner-v4 and revoked access to the
by-summoner league endpoint. Verified directly against the API:

```
GET /lol/summoner/v4/summoners/by-puuid/{puuid}
  → keys: puuid, profileIconId, revisionDate, summonerLevel      (no `id`)

GET /lol/league/v4/entries/by-summoner/{summonerId}
  → HTTP 403 Forbidden

GET /lol/league/v4/entries/by-puuid/{puuid}
  → RANKED_SOLO_5x5 SILVER II 84LP | RANKED_FLEX_SR SILVER IV 0LP
```

Three call sites still depended on the dead path:

1. `previewService` and `publicSummoner` called `getRankedEntriesForPuuid`, which
   resolved `summoner.id` and returned `[]` when it was missing — and swallowed
   every error, so nothing was logged.
2. `matchSyncRankedService` preferred a stored `summonerId` over PUUID:
   `summonerId ? getRankedEntries(...) : getRankedEntriesByPuuidDirect(...)`. Any
   account synced before Riot dropped the field therefore hit the 403 endpoint.

`getRankedEntriesByPuuidDirect` — which tries by-puuid first — already existed and
was already correct. Only these three callers had not been moved onto it.

## Fix

- All three call sites now use `getRankedEntriesByPuuidDirect`.
- `getRankedEntriesForPuuid` is **deleted**. It had no remaining callers and was a
  trap: a summonerId-only lookup that reports "no rank" instead of failing.
- The surviving helper carries a comment explaining why by-summoner must never be
  used on its own.

## Verified

- `/api/public/preview` returns `{"tier":"SILVER","division":"II","lp":84,...}` and
  the generated blurb reads "…at SILVER II".
- `/s/tr1/kaanproak0/TR1` renders "Silver II · 84 LP · 49% WR".
- Triggering a real account sync wrote both `SILVER II 84 RANKED_SOLO_5x5` and
  `SILVER IV 0 RANKED_FLEX_SR` into `ranked_history`.

## Caching note

Preview responses cache for a day in **both** Upstash Redis and Postgres, so the
stale `rank: null` survived the fix until the entry was deleted from each. Any
player whose preview was requested before this fix keeps seeing "No Ranked" for up
to 24 hours.

## Left alone

`syncRankedSnapshot` still has an "auto-repair summonerId" block that calls
Summoner-v4 hoping for an `id`. Riot never returns one now, so it is a wasted
request per sync for PUUID-only accounts and always logs its warning branch. It is
harmless and guarded, but it is dead and should be removed.
