# TASK-026 — Automatic Session Review

**Phase:** 2 — AI Depth & Retention
**Status:** In Progress
**Estimated Effort:** 1 day
**Depends on:** TASK-005 (coaching pipeline), TASK-003.5 (match sync)

---

## Objective

After a user syncs their Riot account and 3+ new matches are detected, automatically
queue a session_review coaching report — no manual "Generate Report" click required.

---

## Acceptance Criteria

- [ ] `syncAccount()` fires `match/session.synced` Inngest event when newMatches ≥ 3
- [ ] `autoSessionReview` Inngest function handles the event
- [ ] Respects plan limits (free: 1/day, 3/month) — silently skips if over budget
- [ ] Dedup: skips if a report was created for this account in the last 3 hours
- [ ] Uses 5 most recent ranked match IDs (same as manual generate)
- [ ] Function is registered in /api/inngest
- [ ] TypeScript clean, build passes
