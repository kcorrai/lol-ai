# TASK-300 — League index, league hubs and standings

**Phase:** 6 — Esports & Audience Growth
**Status:** Done
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

- [x] `/esports/leagues` lists every league grouped by region
- [x] `/esports/leagues/[slug]` renders standings, schedule and results
- [x] Standings normalisation handles a round-robin league and a bracket-only
      league — verified in a browser against LEC Split 3 2026 and Worlds 2025
- [x] An unrecognised or empty stage is skipped, keeping the stages that parsed
- [x] `generateStaticParams` pre-renders the featured leagues; the rest render
      on demand
- [x] Breadcrumbs hub → leagues → league (JSON-LD included)
- [x] Unit tests for `standingsService` (ties, unplayed teams, brackets,
      undecided slots, empty sections, feed down) and `pickCurrentTournament`
- [x] Service under 250 lines; `tsc --noEmit`, lint and tests pass

## Notes from the build

- **Two shapes, not one.** `getStandings` returns a table only when the feed
  publishes `rankings`. Round-robin splits do; swiss and knockout stages (Worlds,
  MSI) publish only `matches`. Computing a table from those would mean inventing
  standings the organiser never published, so a bracket stage stays a bracket and
  the page says so.
- **Ties come from the data, not from equal records.** The feed groups tied teams
  under one `ordinal`; the table renders those as `T4`, `T6` rather than
  inventing an order. Confirmed live — LEC currently has three tied pairs.
- **`pickCurrentTournament` does not simply take the newest.** Next year's split
  is often published months ahead, and leading with it would show an empty table
  while the split people are watching sits a click away. It prefers the split
  running today, then the most recent one to have started.
- A league whose current split has ended now says when the next one starts —
  "Worlds 2026 starts 2026-10-20. Below is how Worlds 2025 finished." Without it
  the Worlds page reads as stale for most of the year.

## Deliberately not done

- **No teams block.** The scope listed one, but the only team data available here
  is what the standings table already shows. A real roster list needs
  `teamService` (TASK-301), and the table would have been duplicated above it.
- **Splits are listed as text, not links.** Tournament pages land in TASK-306; a
  link to a page that does not exist yet is worse than no link.
