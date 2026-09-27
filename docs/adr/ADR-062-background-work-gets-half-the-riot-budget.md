# ADR-062: Background work gets half the Riot budget

## Status: Accepted

## Context

ADR-056 made every instance count Riot calls in one shared place, so the key as a whole stays
inside its limits. It did not say who gets the budget. On a personal key that is 90 requests every
two minutes per region (after ADR-056's headroom), and the same budget serves two very different
callers:

- a visitor opening a profile, who is waiting on the answer, and
- background work — the nightly rank sweep, queued match syncs, timeline capture, rank
  enrichment — which nobody is watching.

Left to share freely, a sweep over a few hundred accounts spends the whole two-minute window again
and again, and every profile lookup made during it answers "Riot is busy".

## Decision

- Work entering through the Inngest handler (`app/api/inngest/route.ts`) or the rank-snapshot
  cron runs under `runAsBackground`. That sets the priority in an `AsyncLocalStorage`, so the Riot
  client below it — several shared services deep — reads it without any service passing it down.
- Background calls are checked against **half** of each window, counted in the **same** shared
  window as foreground calls. Background work therefore stops at 50%, and visitors always have the
  rest; a visitor can also use what background work left unused.
- Background calls may queue up to 60 s for room, where a visitor's call gives up after 5 s.
- For the Upstash store, the Redis key names the window rather than the limit, so a lower ceiling
  checks the same count rather than starting a budget of its own.

## Consequences

- A sweep takes at least twice as long when it is the only thing running. That is the price of a
  profile lookup never waiting behind it.
- Background work that finds no room within a minute fails with `RIOT_RATE_LIMITED`, and Inngest
  retries it with its own backoff.
- `dispatchOrRunInProcess`'s fallback — a sync run inside the request when Inngest cannot be
  reached — runs as foreground. It happens inside a person's request, so that is honest.
- The share is a constant in `src/lib/riot/rateLimit.ts`. When a meta crawler arrives (LA-70), its
  budget should come out of the background half, not be added beside it.
