# TASK-031 — Monthly Milestone Report Email

**Phase:** 3 — Advanced Analysis
**Status:** In Progress
**Estimated Effort:** 1 day
**Depends on:** V2-03 (weekly email infra)

---

## Objective

Send a monthly summary email on the 1st of each month showing the player's
progress over the past 30 days: games played, LP change, win rate, best champion,
rank progression, and AI report count.

---

## Acceptance Criteria

- [ ] `monthlyMilestoneService.sendMonthlyMilestoneReports()` builds and sends emails
- [ ] Idempotency key: `monthly-milestone:{userId}:{YYYY-MM}` (max 1 email/month/user)
- [ ] Shows: games played vs prev month, LP change, win rate, best champion, rank change
- [ ] Skips users with no games this month
- [ ] GET `/api/cron/monthly-milestone` cron route, CRON_SECRET gated
- [ ] Scheduled 1st of month 09:00 UTC in vercel.json
- [ ] TypeScript clean, build passes
