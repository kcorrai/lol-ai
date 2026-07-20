# TASK-278 — Rate limit the remaining public endpoints

## Status: Done

`docs/BACKLOG-SCORED-2026-07-20.md` finding #18 (score 26): `/api/leaderboard`,
`/api/champions/all`, `/api/auth/verify-email`, described as "all cheap and non-mutating, so this is
scraping/noise surface rather than a real DoS or cost vector".

## Two corrections to that characterisation

**`/api/auth/verify-email` is mutating.** It sets `emailVerified` and deletes the verification token
(`route.ts:26-31`). Describing it as non-mutating understates it: it is an unauthenticated,
unlimited endpoint that looks up a token and writes to the user table. The token is long and random
so guessing is impractical, but an unmetered lookup-by-token endpoint is exactly the shape that
should be limited.

**`/api/champions/all` is not cheap in the way that matters right now.** It returns all 173 champion
rows including `imageUrl`, uncached, per request. Given TASK-282 — the Neon data-transfer quota was
exhausted by exactly this kind of repeated read amplification — an unauthenticated endpoint with no
limit and no cache is an egress vector, not just scraping noise.

`/api/leaderboard` declares `revalidate = 300`, but it reads `req.nextUrl.searchParams`, which
forces dynamic rendering — so the route is a database hit per request and the cache declaration does
nothing.

## Changes

IP-keyed limits via the existing `checkRateLimit` / `getIp` / `rateLimitResponse` helpers, matching
how `/api/public/profile/[slug]` already does it. Limits are generous — these are legitimate public
endpoints and the goal is a ceiling, not friction:

| Route | Limit | Reasoning |
|---|---|---|
| `/api/champions/all` | 30 / min | A selector fetches this once per page load |
| `/api/leaderboard` | 60 / min | Two periods, polled by a widget |
| `/api/auth/verify-email` | 10 / min | A human clicks this link once |

`/api/champions/all` also gains a `Cache-Control` header. The champion catalogue changes at most
once per patch, so re-reading it from Postgres on every request is the actual waste — the rate limit
caps the worst case, the cache header removes the common one.

## Acceptance criteria

- [ ] All three limited, keyed by IP.
- [ ] Champion catalogue served with a cache header.
- [ ] Tests covering the limited and unlimited paths.
- [ ] Full suite, typecheck, lint clean.
