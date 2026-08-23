# TASK-301 — Team index and team pages

**Phase:** 6 — Esports & Audience Growth
**Status:** Done
**Estimated Effort:** 1 day
**Depends on:** TASK-300

---

## Objective

A page per pro team that answers the three things people search a team for: who
plays for them, when they play next, and how they have been doing. "t1 roster",
"g2 next match", "[team] results".

## Scope

- **`src/domains/esports/services/teamService.ts`**
  - `getTeams()` — the full active list (24 h), archived teams filtered out of the
    index but still resolvable by slug so old links keep working.
  - `getTeam(slug)` — team + roster (`getTeams?id=slug` returns `players[]` with
    role, image, first/last name and handle).
  - `getTeamMatches(teamId)` — upcoming and completed series for the team,
    assembled from the schedule service rather than a second feed call.
- **`app/(esports)/esports/teams/page.tsx`** — index grouped by league, with the
  team logo, code and region.
- **`app/(esports)/esports/teams/[slug]/page.tsx`** — `revalidate = 86400`:
  - Header: logo, full name, code, home league, current standing (linked).
  - **Roster** — one card per player: role icon, handle, real name, portrait,
    linking to `/esports/players/[slug]`. Substitutes listed separately when the
    feed marks more than five.
  - **Next match** — opponent, tournament, kickoff, countdown.
  - **Recent results** — last ~10 series with score and link to the match page.
  - **Form** — W/L strip over the recent series, and split record from standings.
  - Champion pool summary is deferred to TASK-308; link to it once it exists.
- Empty/thin teams (no roster, no matches) → `noindex, follow` and excluded from
  the sitemap (ADR-017 §4).

## Acceptance Criteria

- [x] `/esports/teams` lists active teams grouped by league
- [x] `/esports/teams/[slug]` renders header, roster, next match, results and form
- [x] An archived team resolves by slug and is absent from the index
- [x] Thin team pages are `noindex` — verified live: T1 indexable,
      Flamengo Esports (no roster, no matches) `noindex`. Sitemap entries land
      with the rest of the section in TASK-309
- [x] Breadcrumbs teams → team (JSON-LD included); `SportsTeam` markup is part
      of the TASK-309 sweep
- [x] Unit tests for mapping, slug resolution, the index filter, the thin-page
      predicate and form
- [x] Components under 200 lines; `tsc --noEmit`, lint and tests pass

## Notes from the build

- **Slugs are not unique.** The feed reuses 53 of them, 17 with more than one
  _active_ entry — usually an archived record holding an old roster beside the
  live org, or two records for one university team. `resolveTeamBySlug` ranks
  candidates: active over archived, then the one with a roster, then a stable id
  tie-break so a slug always resolves to the same team. Deliberately, an active
  team with no roster beats an archived one that has one: showing a 2019 lineup
  as "the roster" is worse than showing none.
- **The index is filtered, not complete.** Of 1175 active teams, 405 have no
  roster and 485 no home league. Only the 440 with both are listed — the rest
  would be exactly the thin filler ADR-017 §4 exists to keep out.
- **Matches are found by code, within a league.** The schedule payload carries no
  team ids (TASK-297), so a team's fixtures are found by scoping the schedule to
  its own league and matching on tricode or name. Scoping first is what makes
  matching a three-letter code safe.
- Form reads oldest → newest, left to right, with the most recent nearest the
  label; the raw data is newest-first and rendering it in that order reads
  backwards against every league table people already know.

## Deliberately not done

- **Roster cards and match rows are not links yet.** Player pages are TASK-302
  and match pages TASK-303.
- **No champion pool block** — that needs game stats (TASK-303/308).
