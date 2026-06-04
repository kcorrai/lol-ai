# TASK-034 — Visual Improvements: Champion Icons, Item Icons, Rank Badges

**Phase:** 3 — Advanced Analysis
**Status:** In Progress
**Estimated Effort:** 0.5 day

---

## Objective

Add Data Dragon visual assets throughout the UI: champion portrait icons, item build icons in
match detail, and rank tier emblems. Replace all plain-text champion names in match lists,
counter-pick cards, and last-game cards with icon + name pairs.

---

## Acceptance Criteria

- [ ] `src/lib/ddragon.ts` — champion icon URL, item icon URL, rank emblem URL helpers
- [ ] `ChampionIcon` reusable component — image with text fallback
- [ ] `ItemIcon` reusable component — item image with empty-slot fallback
- [ ] `RecentMatchList` — champion icon shown left of name
- [ ] `LastGameInsightCard` — champion icon in header
- [ ] `CounterPickCard` — champion icon next to each nemesis/prey entry
- [ ] `RankedCard` — tier image emblem replaces letter emblem
- [ ] Match detail page — champion icon in team table + Items column with 6 item icons
- [ ] `matchService` exposes `itemIds` in `ParticipantDetail`
- [ ] Build passes, TypeScript clean
