# TASK-302 — Player pages

**Phase:** 6 — Esports & Audience Growth
**Status:** Planned
**Estimated Effort:** 1 day
**Depends on:** TASK-301

---

## Objective

A page per pro player. Player names are the most searched entities in esports
("faker", "chovy stats", "[player] champion pool") and they are the natural
bridge into the champion cluster: a player page is a list of champions with a
famous name attached.

## Scope

- **`src/domains/esports/services/playerService.ts`**
  - The feed has no player index — build one by walking `getTeams()` rosters
    (24 h cache, one derived structure keyed by player id and by slug).
  - `playerSlug(handle)` — lowercased, diacritics stripped, non-alphanumerics
    collapsed to `-`. Collisions across regions resolved by appending the team
    code; the mapping is deterministic and covered by a test.
  - `getPlayer(slug)` → handle, real name, role, portrait, current team, league.
  - `getPlayerRecentGames(playerId)` — derived from the team's completed series
    plus per-game participant metadata (TASK-303's `gameStatsService`). Cap the
    walk at the team's last ~15 series so one page never fans out unbounded.
- **`app/(esports)/esports/players/[slug]/page.tsx`** — `revalidate = 86400`:
  - Header: portrait, handle, real name, role, team (linked), league.
  - **Champion pool** — champions played across the recorded games with games,
    wins and win rate; each champion links to `/esports/champions/[champion]`
    (TASK-308) and to `/builds/[champion]`.
  - **Recent games** — champion, opponent, result, KDA, CS, linking to the match.
  - Teammates strip linking to the rest of the roster.
- Players with no recorded games render the header and roster context only, and
  are `noindex, follow` (ADR-017 §4).

## Acceptance Criteria

- [ ] `/esports/players/[slug]` renders for every player on an active roster
- [ ] Slug generation is deterministic, collision-free across the current team
      list, and unit tested
- [ ] Champion pool aggregates only games the feed actually returned — no
      invented totals, and the sample size is stated
- [ ] Players without game data are `noindex` and excluded from the sitemap
- [ ] `Person` JSON-LD (`athlete`, `memberOf`); breadcrumbs team → player
- [ ] Per-page fan-out bounded; verified against a team with a long season
- [ ] Service under 250 lines; `tsc --noEmit`, lint and tests pass
