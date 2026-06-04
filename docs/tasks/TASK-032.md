# TASK-032 — Warm-up Tracker

**Phase:** 3 — Advanced Analysis
**Status:** In Progress
**Estimated Effort:** 1 day

---

## Objective

Show whether the user warmed up before their ranked session today.
Compare first-3-game win rate on days with vs without warm-up to surface the insight.

---

## Acceptance Criteria

- [ ] `warmupService.getWarmupStatus()` checks today's matches for non-ranked games before first ranked game
- [ ] Warm-up window: 2 hours before first ranked game of the day
- [ ] GET `/api/riot/[riotAccountId]/warmup` returns warm-up status
- [ ] `WarmupWidget` shown on dashboard (below TiltWidget)
- [ ] Shows: warm-up game count, first ranked game win/loss, historical comparison
- [ ] TypeScript clean, build passes, tests pass
