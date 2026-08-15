# TASK-303 — Match pages: drafts, scoreboards and gold curves

**Phase:** 6 — Esports & Audience Growth
**Status:** Planned
**Estimated Effort:** 1.5 days
**Depends on:** TASK-301

---

## Objective

The deepest page in the section and the one that unlocks everything downstream
(pro meta, pro builds, player stats): a full series page with per-game drafts,
scoreboards and gold curves, built from the livestats feed.

## Scope

- **`src/domains/esports/services/matchService.ts`**
  - `getMatch(matchId)` → `getEventDetails`: teams, series format, per-game ids
    and states, VOD links, tournament and league context.
- **`src/domains/esports/services/gameStatsService.ts`**
  - `getGameWindow(gameId)` → `feed.lolesports.com/livestats/v1/window/{gameId}`:
    patch, both teams' participant metadata (champion, role, handle), and the
    rolling team totals (gold, kills, towers, dragons, barons).
  - `getGameDetails(gameId)` → `…/details/{gameId}`: per-frame participant stats.
    Take the **last frame** for the final scoreboard (KDA, CS, gold, damage share,
    wards, items, `perkMetadata`) and downsample the frame series to a gold-diff
    curve — do not keep every frame in the cache entry.
  - Completed games cache for 30 days (immutable); in-progress games for 30 s.
  - A game the feed has no stats for (common in tier-2 leagues) must degrade to
    "result only", not break the page.
- **`app/(esports)/esports/matches/[matchId]/page.tsx`** — `revalidate = 3600`
  for completed, 60 for in-progress:
  - Header: teams, series score, tournament, date, VOD link.
  - Game switcher (`?g=`), game 1 canonical (ADR-017 §2).
  - **Draft** — picks in order per side with bans, champion icons from Data
    Dragon, each linking to `/esports/champions/[champion]`.
  - **Scoreboard** — both teams, per player: champion, KDA, CS, gold, damage
    share, items, runes. Player names link to player pages.
  - **Gold curve** — team gold difference over time.
  - Objectives strip: towers, dragons (by type where available), barons.
- Title/description built from real context: "T1 vs Gen.G — LCK Split 3 2026,
  Week 4" so the page competes for the "[a] vs [b]" query.

## Acceptance Criteria

- [ ] A completed Bo3/Bo5 renders every game with draft, scoreboard and gold curve
- [ ] A game with no livestats coverage renders result-only without errors
- [ ] Items and runes resolve through the existing Data Dragon item/rune loaders
- [ ] Frame data is downsampled before caching; cache entry size checked and noted
- [ ] `SportsEvent` JSON-LD with both competitors and the result
- [ ] Unit tests: window mapping, details → final scoreboard, missing-stats path,
      gold-curve downsampling
- [ ] Services under 250 lines each, components under 200; page splits into
      `Draft`, `Scoreboard`, `GoldCurve` sub-components
- [ ] `tsc --noEmit`, lint and tests pass
