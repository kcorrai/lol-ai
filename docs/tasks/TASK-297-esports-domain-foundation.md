# TASK-297 — Esports domain foundation: API client, leagues, schedule

**Phase:** 6 — Esports & Audience Growth
**Status:** Planned
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

- [ ] `getLeagues()`, `getTournamentsForLeague()`, `getUpcoming()`,
      `getCompleted()`, `getLiveEvents()` return mapped domain types
- [ ] Every response is Zod-parsed; an unexpected shape falls back to last-good
      and logs, and never throws to the caller
- [ ] A network failure with no last-good returns `null`/`[]`, not an exception
- [ ] TTLs match the ADR-016 table
- [ ] Unit tests (mocked fetch): happy path, malformed payload → last-good,
      network error → last-good, cold cache + error → empty
- [ ] No file over 250 lines; no `any`; `tsc --noEmit`, lint and tests pass
- [ ] `.env.example` documents `LOLESPORTS_API_KEY`
