# TASK-024 — Tilt Detection Widget

**Phase:** 2 — AI Depth & Retention
**Status:** In Progress
**Estimated Effort:** 1 day

---

## Objective

Analyze the user's recent match history and display a tilt status on the dashboard.
Users should know at a glance whether they're in a good mental state to keep playing
or whether they should take a break.

---

## Acceptance Criteria

- [ ] `tiltService.computeTiltStatus()` calculates a tilt score (0–100) from recent matches
- [ ] Score is based on: loss streak, recent win rate, KDA trend (last 3 vs last 7 games)
- [ ] Three tilt levels: Focused (0–30), Caution (31–60), Tilting (61–100)
- [ ] GET `/api/riot/[riotAccountId]/tilt` returns tilt status + breakdown
- [ ] `useTiltStatus` React Query hook (5min staleTime)
- [ ] `TiltWidget` component displayed on dashboard when Riot account is connected
- [ ] Widget shows: level label, score, loss streak, win rate, actionable message
- [ ] No data state handled gracefully (< 3 matches)
- [ ] TypeScript clean, build passes, tests pass (tiltService unit tests)

---

## Tilt Score Algorithm

| Signal          | Condition               | Points               |
| --------------- | ----------------------- | -------------------- |
| Loss streak     | 1 loss                  | +10                  |
| Loss streak     | 2 losses                | +20                  |
| Loss streak     | 3 losses                | +35                  |
| Loss streak     | 4+ losses               | +50                  |
| Recent win rate | < 50% in last 10        | +15                  |
| Recent win rate | < 40% in last 10        | +25 (replaces above) |
| KDA declining   | Last 3 avg < Last 7 avg | +15                  |
| Not enough data | < 3 matches             | return null          |

Score is capped at 100.
