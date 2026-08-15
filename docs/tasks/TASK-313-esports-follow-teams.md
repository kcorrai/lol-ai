# TASK-313 — Follow teams and match reminders

**Phase:** 6 — Esports & Audience Growth
**Status:** Blocked — requires schema approval
**Estimated Effort:** 1 day
**Depends on:** TASK-301, TASK-305

---

## Objective

Turn one-off esports visitors into returning accounts: let a signed-in user follow
teams and get notified before those teams play.

**This task is blocked by design.** CLAUDE.md §8.2 requires explicit discussion
before a schema change, and every earlier esports task is deliberately stateless
(ADR-016) so the section stays a cache over a feed. Do not start this without
sign-off on the model below.

## Proposed schema

```prisma
model EsportsFollow {
  id        String   @id @default(cuid())
  userId    String
  teamSlug  String   // feed slug, not an FK — we do not own the team table
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, teamSlug])
  @@index([teamSlug])
  @@map("esports_follows")
}
```

One table, no team mirror. `teamSlug` is a soft reference; a rebrand is handled by
the ADR-017 §7 redirect rule plus a one-off data fix, not by a foreign key.

## Scope (once approved)

- Follow/unfollow control on team pages and in the schedule rows.
- `/esports/following` — a personal schedule of followed teams' matches.
- Reminders through the notification channels already built: web push
  (`src/lib/push`), Discord webhook (`settings/discord`) and email preferences.
  One reminder per series, 30 min before kickoff, fired from the TASK-305 job.
- Respect existing notification preferences and the unsubscribe path; a followed
  team must not become a channel the user cannot turn off.
- GDPR: follows are user data — included in export and deletion (TASK-287).

## Acceptance Criteria

- [ ] Schema change explicitly approved and an ADR recorded before any code
- [ ] Migration written, `docs/DATABASE_SCHEMA.md` updated
- [ ] Follow/unfollow works and is idempotent under double-submit
- [ ] `/esports/following` shows the user's upcoming matches, `noindex`
- [ ] Reminders fire once per series and honour notification preferences
- [ ] Follows included in data export and deleted with the account
- [ ] Authorization tests: a user cannot read or modify another user's follows
- [ ] `tsc --noEmit`, lint and tests pass
