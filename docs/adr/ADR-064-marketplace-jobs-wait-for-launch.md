# ADR-064: Marketplace jobs wait for the marketplace to launch

## Status: Accepted

## Context

The marketplace schedules two Inngest jobs: a booking sweep every five minutes
(expiries, settlements, review reveals, reminders) and a coach rank refresh
every six hours. Both run against Neon.

Neon's free plan suspends a compute after five idle minutes, and compute hours
are capped. A query every five minutes means the compute never suspends: the
Neon dashboard on 2026-10-03 showed 16.19 CU-hours used by day three of the
month, about 6 a day, with no suspension anywhere on the graph. Production logs
showed the sweep firing every five minutes, and failing on every run because the
marketplace tables (`bookings`, `session_reviews`) have not been migrated to
production. The marketplace is not live, so the sweep was paying for the whole
day's compute while doing nothing.

## Decision

Both jobs are served to Inngest only when `MARKETPLACE_ENABLED=true`
(`src/inngest/marketplaceSchedules.ts`). When the variable is unset, they are left
out of `serve()`, so Inngest unschedules them on the next sync and nothing is
invoked.

The five-minute cadence itself is unchanged. The reasoning in
`marketplaceSweeps.ts` still holds once there are real bookings with real
deadlines.

## Consequences

- Neon can suspend between visits again; the remaining periodic wake-ups are the
  45-minute esports warm job and the daily crons.
- Launching the marketplace needs two steps besides the code: apply its
  migrations to production, then set `MARKETPLACE_ENABLED=true` in Vercel and
  redeploy. At that point the compute cost returns, and the free plan's compute
  cap will need checking against it.
- Local development and E2E runs do not schedule the sweeps unless the variable
  is set in `.env.local`.
