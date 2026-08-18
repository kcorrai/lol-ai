# ADR-029: The daily quest is derived, not stored

## Status: Accepted

## Context

TODAY'S QUEST gives a player one reason to open the site every day: a small
personal objective, waiting at the top of the dashboard, with a streak attached.

The obvious build is a `daily_quests` table and a nightly job that writes a row
per user — which objective they got, whether they finished it, what the streak
is. Three problems with that:

1. A job that writes a row per user is a job that can fail, and the failure mode
   is a blank quest on a day the player showed up. The quiz already rejected the
   same design for the same reason (ADR-024).
2. Completion would then live in two places. "Did they solve today's puzzle" is
   already a fact in `quiz_attempts`; a second copy in a quest table is a second
   copy that can disagree, and reconciling them is work nobody schedules.
3. A schema change needs discussion under CLAUDE.md §8.2, and this feature does
   not actually need one.

## Decision

Store nothing. The quest is computed on read.

- **Which on-site task** a player gets is `(userId, UTC day)` walked through a
  fixed catalogue — a rotation, not a random pick, so no task repeats until all
  four have been issued. See `dailyQuestCatalog.ts`.
- **Whether it was done** is read back out of the table the action already
  writes: `quiz_attempts`, `academy_progress`, `coaching_reports`,
  `shareable_cards`. See `dailyQuestSignals.ts`.
- **The in-game objective** is the daily `Challenge` the existing generator
  already issues. It is passed through, never re-derived — two places deciding
  today's metric goal would eventually contradict each other on the same screen.
- **The streak** replays the last 30 days over those same signals. A day counts
  when every objective *issued that day* was finished; today is graded but never
  breaks the run, since an unfinished quest at 09:00 is a quest in progress.

XP stays owned by whatever system grants it today. The quest endpoint reports
rewards, it does not pay them — that is what keeps a redo from paying twice.

## Consequences

- No migration, no cron, no reconciliation job. A quest is never missing.
- Backfill is free: the streak of a player who has been solving the quiz for
  three weeks is already correct the day this ships.
- Reading costs six indexed queries over a 30-day window, once per dashboard
  load, cached for 60s by React Query. If the catalogue grows past a handful of
  tasks, or the window past 30 days, this is the number to watch.
- Editing the catalogue rewrites history: change the task list and the rotation
  reshuffles, so a past day may resolve to a task the player was never actually
  shown. Streaks can move. Adding tasks is therefore a deliberate act, not a
  copy edit — and the reason the catalogue lives in code review rather than in
  a CMS.
- A dismissed quest is remembered in `localStorage`, per day, per browser.
  Dismissal is a display preference, not state worth a row.
