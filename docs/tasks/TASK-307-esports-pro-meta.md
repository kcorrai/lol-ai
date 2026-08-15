# TASK-307 — Pro pick/ban meta table

**Phase:** 6 — Esports & Audience Growth
**Status:** Planned
**Estimated Effort:** 1 day
**Depends on:** TASK-303, TASK-306

---

## Objective

"What are the pros actually playing" — pick rate, ban rate, presence and win rate
per champion, per tournament. This is the cluster that no schedule aggregator
serves well, and the one that hands esports traffic straight to the champion
pages we already rank for.

## Scope

- **`src/domains/esports/services/proMetaService.ts`**
  - `getProMeta({ tournamentId | leagueId, patch? })` — walk the tournament's
    completed games (via `matchService` + `gameStatsService`, both already cached)
    and aggregate per champion: games picked, games banned, presence
    (`(picks + bans) / games`), wins, win rate, and picks split by role.
  - Also emits: total games in the sample, the patch range covered, and the date
    of the last game — every table states its sample, because a pick rate over
    six games is noise and the page must say so.
  - Aggregation is cached per tournament for 1 h (24 h once the tournament is
    complete) and is **never computed in a request that could be a cache miss on
    a cold page** — it is warmed by TASK-305.
- **`app/(esports)/esports/champions/page.tsx`** — `revalidate = 3600`:
  - Sortable table: champion, presence, picks, bans, wins, win rate, top role.
  - Scope switcher (tournament / league / "all current splits") as chips; the
    default scope is canonical, the others `noindex, follow`.
  - Each row links to `/esports/champions/[champion]` (TASK-308) and to
    `/builds/[champion]`.
  - Blank-slate honesty: below a minimum sample the table renders with a stated
    caveat rather than being hidden.
- Same table embedded on the tournament page as a "champion meta" section.

## Acceptance Criteria

- [ ] Pick/ban/presence/win rate correct for a completed tournament, verified by
      hand against a known series set
- [ ] Sample size, patch range and last-game date shown on every table
- [ ] Bans counted from the draft even when the game has no full stats payload
- [ ] Aggregation cached per scope; a cold cache never blocks a page render past
      the ISR window
- [ ] Sorting works without a native `<select>`; sorted views are not indexable
      duplicates
- [ ] Unit tests: aggregation maths, small-sample caveat, missing-draft handling
- [ ] Service under 250 lines; `tsc --noEmit`, lint and tests pass
