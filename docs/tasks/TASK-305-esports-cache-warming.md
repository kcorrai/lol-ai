# TASK-305 — Cache warming and revalidation on the match calendar

**Phase:** 6 — Esports & Audience Growth
**Status:** Planned
**Estimated Effort:** 0.5 day
**Depends on:** TASK-304

---

## Objective

Esports traffic is spiky and time-locked: everyone arrives in the ten minutes
after a series ends. ISR alone means the first of those visitors pays the fetch
and the rest may still get a stale page. Warm the caches on the calendar instead.

## Scope

- **`src/inngest/functions/warmEsportsCache.ts`** — scheduled function alongside
  the existing Inngest jobs:
  - Every 15 min: refresh the schedule window and live events.
  - Every hour: refresh standings for tournaments with a match in the last 24 h.
  - Once a day (off-peak): refresh leagues, teams and rosters.
  - After a series flips to `completed`: fetch and cache its game stats once, then
    call `revalidatePath` for that match page, the two team pages, the league hub
    and the tournament page.
- Warming reads through the same domain services — no second code path, no
  bypassing the Zod boundary.
- Budget guard: a hard cap on requests per run, and a log line with the number of
  resources refreshed, so a runaway loop is visible rather than silent.
- Failures are non-fatal: a warm run that errors leaves the last-good snapshots in
  place and reports through the existing logger/Sentry path (fail-closed
  precedent: TASK-264).

## Acceptance Criteria

- [ ] Scheduled function registered and visible in the Inngest dashboard
- [ ] Schedule/live warmed every 15 min; standings hourly; static data daily
- [ ] A newly completed series triggers a stats fetch and targeted
      `revalidatePath` calls for the affected routes
- [ ] Per-run request cap enforced and logged
- [ ] A warm failure does not clear or corrupt any cache entry
- [ ] Tests: revalidation targets for a completed series; cap enforcement
- [ ] `tsc --noEmit`, lint and tests pass
