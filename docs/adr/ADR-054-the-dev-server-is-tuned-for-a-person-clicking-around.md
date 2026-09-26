# ADR-054: The dev server is tuned for a person clicking around

## Status: Accepted

## Context

Local development had become slow enough to be the complaint: a signed-in
dashboard took 15–65s the first time and 6s after that, and every page, even
`/login`, took over a second on every request. Four separate causes, each
measured on 2026-09-26 by switching it on and off with everything else fixed
(Next 14.2.35, Ryzen 7 5700X, Windows, local Postgres):

| Cause                                                   | With                                                                   | Without                   |
| ------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------- |
| Turbopack (`next dev --turbo`, TASK-286)                | every warm request ~1.2s                                               | 0.05–0.2s                 |
| Same, cold compile of 12 public routes, `.next` removed | ~155s total                                                            | ~44s total                |
| Next disposing routes idle for 60s, keeping at most 5   | a second pass over the 200 API routes took 4 min, as long as the first | compiled once per session |
| `withSentryConfig` in dev, no DSN set                   | startup 18–27s, 10 API compiles 15–22s                                 | startup ~6s, 12–13s       |
| Upstash from a dev machine                              | ~130ms per round trip; signed-in API calls ~430ms                      | ~130ms                    |

TASK-286 picked Turbopack when warm renders were 0.06s in both bundlers. That no
longer holds, and webpack's cold compiles are now faster too.

Pre-compiling every route at startup was tried and dropped: 200 API routes take
six minutes, and the page being visited queues behind them.

## Decision

- `npm run dev` runs `next dev -p 3001` on webpack.
- `onDemandEntries` keeps compiled routes for an hour, up to 100. It is a dev
  server setting; `next build` ignores it.
- On a dev server with no `NEXT_PUBLIC_SENTRY_DSN`, `next.config.mjs` exports the
  plain config instead of the Sentry-wrapped one. Builds always wrap.
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` stay unset in a local `.env.local`. The
  code already falls back to the local Postgres for the cache and to in-memory
  counters for rate limits and brute-force lockouts. It also stops local runs
  reading and writing the deployed Redis.

## Consequences

- Cold per-route compiles still cost seconds — that is dev mode. Production speed
  is `npm run build && npm start`.
- A worktree with a junctioned `node_modules` can now use `npm run dev`;
  Turbopack could not resolve it.
- Testing Upstash-specific behaviour locally (distributed rate limits, the Redis
  cache itself) means uncommenting the two variables and restarting.
- If Turbopack is reconsidered after a Next upgrade, re-measure warm requests, not
  only cold compiles; the cold number alone is what hid the regression here.
