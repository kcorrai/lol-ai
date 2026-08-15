# TASK-304 — Live scoreboard: API route, hook, polling island

**Phase:** 6 — Esports & Audience Growth
**Status:** Planned
**Estimated Effort:** 1 day
**Depends on:** TASK-303

---

## Objective

Make the live surface actually live — a scoreboard that updates while a game is
being played, without the browser ever touching a Riot host and without turning
the section into a polling cost centre.

## Scope

- **`app/api/esports/live/route.ts`** — thin handler per the architecture rule:
  validate, delegate, respond. Returns currently-live events, and when
  `?gameId=` is present, the live window snapshot (score, gold, per-player KDA/CS).
  Public and unauthenticated, so it is rate limited like the other public
  endpoints (precedent: TASK-278). Response is `Cache-Control: s-maxage=20`.
- **`src/hooks/useLiveEsports.ts`** — React Query hook. `refetchInterval` of 30 s
  **only while something is live**; returns to `false` when the payload says
  nothing is in progress, so an off-season visitor polls exactly once. Paused
  when the tab is hidden.
- **`src/domains/esports/components/LiveScoreboard.tsx`** — the client island.
  Server renders the first frame from the cached snapshot so there is content in
  the HTML for crawlers and no layout shift; the hook takes over on hydration.
- Mounted in three places: the hub's "live now" block, the schedule's live rows,
  and the match page when a game is in progress.
- A "LIVE" state is the one place in the section allowed the accent colour
  (ADR-015 rations it) — plus a `prefers-reduced-motion`-respecting pulse.

## Acceptance Criteria

- [ ] `/api/esports/live` returns live events and, with `?gameId=`, a live window
- [ ] Route is rate limited and returns the standard error envelope on abuse
- [ ] Hook polls at 30 s only while live, stops when nothing is live, pauses on
      a hidden tab
- [ ] Server-rendered first frame present in the HTML (view-source check)
- [ ] Feed failure mid-poll keeps the last rendered state and shows a stale
      indicator rather than clearing the scoreboard
- [ ] No Riot host appears in any client-side request (network tab check)
- [ ] Route handler under 80 lines; component under 200
- [ ] Tests: route handler happy path + rate limit; hook interval behaviour
- [ ] `tsc --noEmit`, lint and tests pass
