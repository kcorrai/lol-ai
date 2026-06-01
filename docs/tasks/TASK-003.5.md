# TASK-003.5 — External API Resilience & Data Ingestion Layer

**Phase:** 1 — MVP  
**Status:** Not Started  
**Estimated Effort:** 0.5 day  
**Depends on:** TASK-002.5 (ApiError + withAuth must exist)  
**Blocks:** TASK-004 (Riot API Integration)

---

## Objective

Build the resilience plumbing that sits between the application and any external
HTTP API (primarily Riot API). TASK-004 will implement the Riot-specific routes;
this task provides the infrastructure those routes sit on.

Without this layer, TASK-004 would need to inline rate limit handling, retry
logic, and cache logic in every service function — a recipe for inconsistency
and production incidents.

---

## Acceptance Criteria

- [ ] `cache.ts` — async TTL cache with in-memory backend; interface allows drop-in Redis swap
- [ ] `rateLimit.ts` — token bucket implementation, configurable capacity + refill rate
- [ ] `retry.ts` — `withRetry()` utility with exponential backoff + jitter; respects `Retry-After` header
- [ ] `errors.ts` — `normalizeRiotError()` maps Riot HTTP status codes to internal `ApiError`
- [ ] `client.ts` — `RiotHttpClient` class: injects API key header, integrates rate limiter + retry + error normalization
- [ ] TypeScript: 0 errors. ESLint: 0 warnings.
- [ ] No new npm packages (pure Node.js built-ins + native fetch)

---

## Files to Create

```
src/lib/riot/
├── cache.ts       → CacheStore interface + MemoryCacheStore implementation
├── rateLimit.ts   → TokenBucket class
├── retry.ts       → withRetry() + sleep()
├── errors.ts      → normalizeRiotError()
└── client.ts      → RiotHttpClient (ties everything together)
```

## Files NOT to Modify

Everything outside `src/lib/riot/`. This task has zero impact on auth, schema,
or existing API routes.

---

## Technical Constraints

- Use native `fetch` (Node 18+) — no axios
- No new npm dependencies
- `CacheStore` interface must be async to allow Redis swap in Phase 2
- `RiotHttpClient` must be instantiatable without a real API key in tests
  (key injected from env, defaults to empty string)

## Riot API Rate Limits (context for implementer)

Development key: 20 req/sec, 100 req/2 min  
Production key: varies by tier, configured via env

The token bucket is configured from env vars `RIOT_RATE_LIMIT_PER_SECOND`
(default 20) and `RIOT_RATE_LIMIT_BURST` (default 20), making the limits
easy to tune without code changes.

---

## Dependencies

- TASK-002.5 (`ApiError`, `Errors.*` must exist)

## Blocks

- TASK-004 — `RiotHttpClient` is the foundation of all Riot API calls
