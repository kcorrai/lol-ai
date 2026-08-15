# TASK-300 — League index, league hubs and standings

**Phase:** 6 — Esports & Audience Growth
**Status:** Planned
**Estimated Effort:** 1 day
**Depends on:** TASK-297

---

## Objective

Own the standings cluster — "lec standings", "lck standings 2026", "[league]
schedule" — with a league hub that is the natural landing page for a whole region.

## Scope

- **`src/domains/esports/services/standingsService.ts`**
  - `getStandings(tournamentId)` → normalised table: rank, team, W-L, game W-L,
    win rate, and (where the format provides it) qualification status.
  - The feed returns `stages[].sections[].rankings` for round-robin formats and
    `stages[].sections[].matches` for brackets, and the shape varies by region and
    by year. Normalise both into `{ kind: "table" | "bracket", … }` and **tolerate
    a stage shape we have not seen** — skip it and render what parsed, never throw.
  - 1 h fresh TTL, last-good fallback.
- **`app/(esports)/esports/leagues/page.tsx`** — league index grouped by region
  (International, Korea, China, EMEA, Americas, …), each linking to its hub.
- **`app/(esports)/esports/leagues/[slug]/page.tsx`** — `revalidate = 3600`,
  `generateStaticParams` from the league list:
  - Current split's standings table (the primary content, above the fold).
  - Upcoming matches and latest results for that league.
  - Teams in the league, linking to team pages.
  - Split switcher listing the league's tournaments, linking to
    `/esports/tournaments/[slug]` (TASK-306).
- Unknown slug → `notFound()`.

## Acceptance Criteria

- [ ] `/esports/leagues` lists every league grouped by region
- [ ] `/esports/leagues/[slug]` renders standings, schedule, results and teams
- [ ] Standings normalisation handles a round-robin league and a bracket-only
      league (verify against one of each — e.g. LEC regular season and Worlds)
- [ ] An unrecognised stage shape degrades to the stages that parsed
- [ ] `generateStaticParams` pre-renders the major leagues; others render on demand
- [ ] `ItemList` JSON-LD for the standings table; breadcrumbs hub → leagues → league
- [ ] Unit tests for `standingsService` covering both formats and a malformed stage
- [ ] Service under 250 lines; `tsc --noEmit`, lint and tests pass
