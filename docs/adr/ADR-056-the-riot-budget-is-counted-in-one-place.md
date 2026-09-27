# ADR-056: The Riot budget is counted in one place

## Status: Accepted

## Context

Riot limits an API key per routing value (`euw1`, `europe`, …) across several windows at once — a
personal key is 20 requests per second **and** 100 per two minutes; a production key is 500 per
ten seconds and 30,000 per ten minutes. A key that keeps going over is blacklisted, temporarily
at first and for longer each time, and while it is every Riot-backed page is down.

The limiter this replaces was a token bucket in process memory with one window (20/s). Three
things were wrong with it:

- **Every serverless instance had the whole budget.** Ten warm instances meant ten times the limit.
- **The two-minute window did not exist for it.** A personal key's 100/2min was never enforced.
- **Retries skipped it.** The bucket was consumed once, outside `withRetry`, so every retry of a
  429 went out ungated — the burst Riot blacklists for.

Kaan cannot run a live site yet, so a production key cannot be applied for. Everything has to fit a
personal key today and grow into a production key without a code change.

## Decision

- Limits are read in Riot's own header format, `count:seconds,…`, from `RIOT_APP_RATE_LIMIT`
  (default `20:1,100:120`), and replaced by whatever `X-App-Rate-Limit` Riot returns for that host.
  90% of each window is used; the rest absorbs the gap between our clock and Riot's.
- Counting happens in Upstash Redis via `@upstash/ratelimit` (already a dependency), one sliding
  window per limit, scoped by host. Without Redis, or when Redis errors, an exact in-memory sliding
  window takes over for that process.
- The gate sits inside `withRetry`, so every attempt is counted.
- An `application` 429 writes a pause for that host to Redis; every instance honours it. `method`
  and `service` 429s do not pause the host.
- A request waits at most 5 seconds for room. Past that — and for any `Retry-After` longer than the
  retry cap — it fails with `RIOT_RATE_LIMITED`, which pages already show as "Riot is busy" and
  Inngest retries later.

## Consequences

- One Redis round trip per window per Riot call (two on a personal key). This spends Upstash
  commands; the free allowance is finite and should be watched.
- `@upstash/ratelimit`'s sliding window is an approximation that can briefly admit slightly more
  than the limit; the 10% headroom is what covers it.
- Checking windows one after another means a refusal from the long window has already spent a slot
  in the short one. Windows are checked shortest first so that the slot lost is the one that comes
  back within a second.
- Method limits are not tracked; they are larger than a personal key's application limit, and a
  method 429 still falls back to the ordinary retry.
- `RIOT_RATE_LIMIT_PER_SECOND` and `RIOT_RATE_LIMIT_BURST` are no longer read.
