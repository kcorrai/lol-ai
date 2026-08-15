# TASK-304 — Live scoreboard: API route, hook, polling island

**Phase:** 6 — Esports & Audience Growth
**Status:** Done
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

- [x] `/api/esports/live` returns live events and, with `?gameId=`, a live window
- [x] Route is rate limited and returns the standard error envelope on abuse
- [x] Hook polls at 30 s only while live and stops when nothing is; React Query
      pauses a hidden tab
- [x] Server-rendered first frame present in the HTML — the live block is in the
      markup before any JavaScript runs
- [x] A failed poll keeps the last scoreboard and labels itself "reconnecting"
      rather than clearing
- [x] **No Riot host in any client-side request** — instrumented `window.fetch`
      for 35 s on `/esports`: 1 call to `/api/esports/live`, 0 to any Riot host
- [x] Route handler 27 lines; components under 200
- [x] Tests: route happy path, `?gameId=`, rate-limit refusal
- [x] `tsc --noEmit`, lint and tests pass

## Notes from the build

- **Nothing live means nothing polled, structurally.** The hub only mounts the
  island when the server already found a live match, and the hook's interval is
  a function of the payload — so an off-season visitor runs no timer at all,
  rather than relying on a condition inside the hook.
- **The signed-out branch needed its own `QueryProvider`.** The esports section
  is deliberately login-free, so the marketing chrome had to gain the provider
  the app shell already carries — the same fix the Free Tools layout made.
- A live game's stats are cached under a separate key from the finished ones
  (TASK-303), so polling a game in progress can never poison the permanent
  record of how it ended.
- The edge cache is 20 s, deliberately shorter than the 30 s client poll: a
  shared CDN copy should never be the reason a scoreboard looks frozen.
