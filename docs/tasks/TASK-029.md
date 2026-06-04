# TASK-029 — Rank Change Email Notification

**Phase:** 2 — AI Depth & Retention
**Status:** In Progress
**Estimated Effort:** 0.5 day
**Depends on:** TASK-003.5 (match sync), V2-03 (weekly email infra)

---

## Objective

Send a congratulatory or motivational email when a player's rank tier or division
changes after a sync. Promotions get a celebration email; demotions get an
encouraging recovery message.

---

## Acceptance Criteria

- [ ] `matchSyncService` fires `rank/changed` Inngest event when tier or division changes
- [ ] `sendRankChangeEmail` Inngest function handles the event
- [ ] Promotion email: congratulates, shows new rank, links to dashboard
- [ ] Demotion email: encouraging message, suggests generating a coaching report
- [ ] Gracefully skips if user has no email or Resend is not configured
- [ ] TypeScript clean, build passes
