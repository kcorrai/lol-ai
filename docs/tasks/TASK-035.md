# TASK-035 — Match Detail Expansion: Items in List, Spells & Damage Bars

**Phase:** 3 — Advanced Analysis
**Status:** In Progress
**Estimated Effort:** 0.5 day

---

## Objective

Add richer visual data to match history rows (item build) and the match detail scoreboard
(summoner spells, damage share bars). Brings the detail level closer to tracker.gg.

---

## Acceptance Criteria

- [ ] `MatchPerformance` type includes `itemIds: number[]`
- [ ] `matchAnalysisService` propagates itemIds from DB
- [ ] `RecentMatchList` shows 6 item icons on a second line per match row
- [ ] `ddragon.ts` — `summonerSpellUrl(id)` helper with full ID→name mapping
- [ ] `SummonerSpellIcon` reusable component
- [ ] `matchService` exposes `summonerSpell1 / summonerSpell2` in `ParticipantDetail`
- [ ] Match detail team table: summoner spell icons stacked left of champion icon
- [ ] Match detail team table: damage column shows value + visual share bar
- [ ] Build passes, TypeScript clean
