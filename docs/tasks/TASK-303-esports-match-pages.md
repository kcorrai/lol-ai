# TASK-303 — Match pages: drafts, scoreboards and gold curves

**Phase:** 6 — Esports & Audience Growth
**Status:** Done
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

- [x] A completed Bo5 renders every game with draft and scoreboard — verified
      against the 2025 Worlds final (T1 3-2 kt Rolster)
- [x] A game with no livestats coverage renders result-only without errors —
      verified against an unstarted LFL playoff match
- [x] Items resolve through the existing Data Dragon loaders (`ItemIcon`)
- [x] Only the final frame is kept, so a cache entry is one frame per game
- [x] Unit tests: window/details merge, prefix stripping, empty item slots,
      details-missing path, cache keys and TTLs, past-window requirement,
      empty frames, feed down; plus `getMatch` mapping and `defaultGame`
- [x] Services under 250 lines, components under 200; the page composes
      `DraftPanel` and `Scoreboard`
- [x] `tsc --noEmit`, lint and tests pass
- [ ] `SportsEvent` JSON-LD — part of the TASK-309 structured-data sweep
- [ ] Gold curve — filed as TASK-315, see below

## Notes from the build

- **The two feeds disagree about sides, and it matters.** `getEventDetails` puts
  T1 on blue for game 1 of the 2025 final; the livestats feed puts kt Rolster
  there — and livestats is the one whose team id sits beside the five players it
  lists. The first version of this page trusted the event payload and labelled
  the draft with the wrong team on every match. Side names now come from the
  game data itself, with the event payload only as a fallback.
- **One request gets a finished game.** The livestats window rejects a
  `startingTime` in the future, but any past time after a game ended clamps to
  the end and returns the final frame. So "two minutes ago" fetches the final
  state of any completed game — no probing for the end, no walking frames.
- **Details are a bonus, not a requirement.** KDA, CS and gold come from the
  window; kill participation, damage share, items and runes from the details
  feed. A game the details endpoint has nothing for still renders a scoreboard.
- Live and completed stats use different cache keys (30s vs 30 days) so a
  mid-game snapshot can never be served later as the final result.
- Handles arrive prefixed with the team code ("KT PerfecT"); the code is already
  on the page, so the scoreboard strips it.

## Deliberately not done

- **No bans in the draft panel.** The feed publishes the ten champions that were
  played and nothing about what was banned — a bans row would be a row of blanks.
  Pick order is not published either, so the panel shows picks in lane order.
- **No gold curve — filed as TASK-315.** The window endpoint returns 100 seconds
  of frames per request, so a curve means ~9 extra requests per game against an
  unofficial feed. That is a cost decision of its own, not a detail of this page.
