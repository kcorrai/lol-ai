# TASK-003.6 — Data Lifecycle & Invalidation Layer

**Phase:** 1 — MVP  
**Status:** Complete  
**Estimated Effort:** 0.5 day  
**Depends on:** TASK-003.5 (RiotHttpClient, CacheStore must exist)  
**Blocks:** TASK-004 (Riot API Integration)

---

## Scope Clarification

TASK-003.5 already covers: TTL-based expiry, manual `cache.del()`, retry on stale
responses. This task adds only what is **genuinely missing**:

| Concern | Status after 003.5 | This task adds |
|---|---|---|
| TTL invalidation | ✅ `cache.set(ttl)` | — |
| Manual del | ✅ `cache.del(key)` | Cache key factory |
| Immutable match versioning | ✅ matches never change once played | — |
| Staleness detection | ❌ no utility | `isDataStale()` |
| In-flight dedup | ❌ two concurrent callers → two network calls | `dedup()` |
| Background refresh | ❌ no fire-and-forget wrapper | `backgroundRefresh()` |
| Invalidation patterns | ❌ callers invent ad-hoc keys | `CacheKeys.*` + `invalidateAccountCache()` |

---

## Acceptance Criteria

- [x] `dedup.ts` — `dedup(key, fn)` returns same promise for concurrent callers with same key
- [x] `lifecycle.ts` — `CacheKeys.*` factory: centralized key definitions for all Riot resources
- [x] `lifecycle.ts` — `isDataStale(lastSyncedAt, maxAgeMinutes)` returns boolean
- [x] `lifecycle.ts` — `backgroundRefresh(fn)` fire-and-forget with error logging
- [x] `lifecycle.ts` — `invalidateAccountCache(puuid, summonerId, region)` batch-deletes related keys
- [x] TypeScript: 0 errors. ESLint: 0 warnings.
- [x] No new npm packages.

---

## Files to Create

```
src/lib/riot/dedup.ts       → in-flight request deduplication
src/lib/riot/lifecycle.ts   → CacheKeys, isDataStale, backgroundRefresh, invalidateAccountCache
```

## Files NOT to Modify

Everything outside `src/lib/riot/`.

---

## Notes

Match data is immutable once played — no versioning needed. The Riot match API
never updates an existing match record. "Riot data versioning" for this project
means: detecting that new matches have been played since the last sync, which is
handled by comparing `lastSyncedAt` against the match timestamps in TASK-004.
