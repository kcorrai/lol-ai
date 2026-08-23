# TASK-302 — Player pages

**Phase:** 6 — Esports & Audience Growth
**Status:** Done
**Estimated Effort:** 1 day
**Depends on:** TASK-301, TASK-303 (built after it, see below)

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

- [x] `/esports/players/[slug]` renders for every player on an active roster —
      verified live for Faker (T1, 9 recorded games) and Chovy
- [x] Slug generation is deterministic, collision-free, and unit tested
- [x] Champion pool aggregates only games the feed returned, and the page states
      the sample it was read from
- [x] Breadcrumbs teams → team → player (JSON-LD included)
- [x] Per-page fan-out bounded to the team's last four series
- [x] Service under 250 lines; `tsc --noEmit`, lint and tests pass
- [ ] `Person` JSON-LD — part of the TASK-309 structured-data sweep
- [ ] Sitemap entries and the `noindex` rule for empty players — TASK-309

## Notes from the build

- **Built after TASK-303, not before.** A player page without a champion pool is
  a roster entry with a headline; the pool needs per-game stats, which arrive
  with the match pages. The plan had these the other way round.
- **604 of ~2800 handles collide**, mostly because an academy team lists the same
  player as the main squad — "chovy" is on both Gen.G and Gen.G Challengers.
  Giving every colliding player a suffixed slug would have cost
  `/esports/players/chovy`, one of the most valuable URLs in the section, to
  avoid an ambiguity with an obvious answer. The plain slug goes to the candidate
  in the more prominent league (leagues arrive pre-ranked from `getLeagues`),
  ties break on team code, and the rest become `handle-teamcode`. Verified live:
  `/esports/players/chovy` resolves to Gen.G, not the Challengers roster.
- **Cost is bounded by sharing.** Reading a pool costs one match lookup plus two
  livestats calls per game, over the team's last four series. Game stats cache
  per _game_ for a month, so the first player of a team pays and the other nine
  are nearly free.
- Roster cards and teammate chips now link to player pages, so team ↔ player
  navigation closes both ways.

## Deliberately not done

- **No per-game win/loss.** The livestats feed publishes no winner flag, and
  inferring one from kills or towers is wrong often enough to matter. Recent
  games list champion, KDA and CS, and link to the match for the result.
- Champion links point at `/champions/[name]` for now; TASK-308 retargets them
  to the pro-play pages once those exist.
