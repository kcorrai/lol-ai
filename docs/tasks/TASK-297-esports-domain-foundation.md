# TASK-297 — Esports domain foundation: API client, leagues, schedule

**Phase:** 6 — Esports & Audience Growth
**Status:** Done
**Estimated Effort:** 1 day
**Depends on:** —
**Decisions:** [ADR-016](../adr/ADR-016-esports-data-source.md)

---

## Objective

Stand up `src/domains/esports/` as an isolated bounded context with a defensive
client for the LoL Esports feed, and the two services every later task depends on:
leagues/tournaments and the schedule. No UI in this task.

## Scope

`src/domains/esports/`

- **`services/esportsApi.ts`** — the only place that knows the feed exists.
  - `esportsFetch(path, params)` → `https://esports-api.lolesports.com/persisted/gw/…`
    with `x-api-key` from `LOLESPORTS_API_KEY`, our User-Agent, `hl=en-US`.
  - `cachedResource({ key, ttlDays, schema, fetcher, map })` — the fresh +
    never-expiring last-good pattern from `opggShared`/`metaStatsService`, reused
    rather than reinvented: parse with Zod, write `:fresh` and `:last-good`, fall
    back to `:last-good` on validation failure or network error, log at `warn`.
  - `httpsAsset(url)` — the feed returns some image URLs as `http://`; upgrade
    them, because the CSP will block mixed content.
- **`types.ts`** — our shapes (`EsportsLeague`, `EsportsTournament`,
  `EsportsEvent`, `EsportsTeamRef`, `EventState`), never the feed's.
- **`services/leagueService.ts`** — `getLeagues()` (24 h), `getLeague(slug)`,
  `getTournamentsForLeague(leagueId)` (1 h). Leagues sorted by the feed's
  `priority`/`displayPriority` so the hub's ordering is Riot's, not ours.
- **`services/scheduleService.ts`** — `getUpcoming({ leagueIds?, limit })`,
  `getCompleted({ leagueIds?, limit })`, `getLiveEvents()`. Handles the feed's
  `pages.older`/`pages.newer` token paging behind a plain `limit`.
- **`index.ts`** — public API. Nothing outside the domain imports a service file
  directly.

Also: `LOLESPORTS_API_KEY` added to `.env.example` with a comment stating it is
the public web-client key, not a secret, and that it is server-side only.

## Acceptance Criteria

- [x] `getLeagues()`, `getTournamentsForLeague()`, `getUpcoming()`,
      `getCompleted()`, `getLiveEvents()` return mapped domain types
- [x] Every response is Zod-parsed; an unexpected shape falls back to last-good
      and logs, and never throws to the caller
- [x] A network failure with no last-good returns `null`/`[]`, not an exception
- [x] TTLs match the ADR-016 table
- [x] Unit tests (mocked fetch): happy path, malformed payload → last-good,
      network error → last-good, cold cache + error → empty
- [x] No file over 250 lines; no `any`; `tsc --noEmit`, lint and tests pass
- [x] `.env.example` documents `LOLESPORTS_API_KEY`

## Notes from the build

- **Two event shapes, one schema.** `getSchedule` returns a lean event (no event
  id, no league id, teams without id or slug) while `getLive` returns a rich one.
  `eventMapper.ts` holds the tolerant schema both use; team slugs stay `null`
  rather than being invented, and TASK-301 resolves them through the team index.
- **Unrenderable entries are skipped, not guessed at** — non-match entries, events
  with no match payload, and unrecognised states. Printing "final" over a game
  still being played is worse than omitting the row.
- **Paging is capped** at the current window plus two, and only pages at all when
  the requested limit exceeds one window. A league mid-split costs one request.
- `cache: "no-store"` on the underlying fetch: our cache layer is the single
  authority on freshness, so the Next fetch cache does not hold a second copy on
  a different clock.
- Verified against live payloads (45 leagues, 34 LEC tournaments, 80 schedule
  events, 2 live events): all parse, all map, no `http://` asset survives.
