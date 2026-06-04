# TASK-030 — Personal Counter Pick Analysis

**Phase:** 2 — AI Depth & Retention
**Status:** In Progress
**Estimated Effort:** 1 day

---

## Objective

Show each player their personal nemesis and prey champions — derived from their own
match history, not generic tier-list data. "You lose to Malzahar 80% of the time.
You beat Yasuo 75% of the time."

---

## Acceptance Criteria

- [ ] `counterPickService.getCounterStats()` queries matches where player played a given champion, groups enemies by champion, computes win rate
- [ ] GET `/api/riot/[riotAccountId]/counters?champion=X` returns top nemeses + top prey (min 3 games)
- [ ] `useCounterPicks` React Query hook
- [ ] `CounterPickCard` component shown on champions page below each champion card
- [ ] Shows top 3 nemeses (red) and top 3 prey (green) with game count + win rate
- [ ] TypeScript clean, build passes
