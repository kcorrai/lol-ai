# TASK-033 — Session Readiness Score

**Phase:** 3 — Advanced Analysis
**Status:** Done
**Estimated Effort:** 0.5 day

---

## Objective

Aggregate the user's tilt status, warm-up status, and recent win rate into a single
0–100 "Session Readiness" score that answers: **Should I queue for ranked right now?**

No new API endpoint — computed client-side from data already fetched by TiltWidget and
WarmupWidget hooks.

---

## Acceptance Criteria

- [x] `computeReadinessScore(tilt, warmup)` in `sessionReadinessService.ts` returns `{ score, level, factors, advice }`
- [x] Score formula: Tilt (40 pts) + Warm-up (25 pts) + Recent win rate (35 pts)
- [x] Levels: `ready` ≥ 65 · `caution` 40–64 · `not_ready` < 40
- [x] `SessionReadinessWidget` shown on dashboard below WarmupWidget
- [x] Shows: score bar, level badge, 3 factor pills, advice text
- [x] TypeScript clean, build passes, tests pass
