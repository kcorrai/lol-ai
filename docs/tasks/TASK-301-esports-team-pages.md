# TASK-301 — Team index and team pages

**Phase:** 6 — Esports & Audience Growth
**Status:** Planned
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

- [ ] `/esports/teams` lists active teams grouped by league
- [ ] `/esports/teams/[slug]` renders header, roster, next match, results and form
- [ ] An archived team resolves by slug and is absent from the index
- [ ] Thin team pages are `noindex` and excluded from the sitemap
- [ ] `SportsTeam` JSON-LD with `member` entries for the roster; breadcrumbs
- [ ] Unit tests for `teamService` mapping and the thin-page predicate
- [ ] Components under 200 lines; mobile clean at 390px
- [ ] `tsc --noEmit`, lint and tests pass
