# TASK-253 — Harden the AI matchup-guide endpoint

## Problem

`app/api/analysis/matchup-guide/route.ts` is the only route in the app that calls `getAiClient()`
directly, and it was the only AI route with **no rate limit**. It interpolated two unvalidated
client-supplied strings straight into the LLM prompt and into the AI cache key:

```ts
const { playerChampion, opponentChampion, wins, losses, avgKda } = body;
if (!playerChampion || !opponentChampion) { … }          // existence check only

const cacheKey = buildCacheKey("matchup-guide", { playerChampion, opponentChampion });
…
`Write a ${playerChampion} vs ${opponentChampion} matchup guide. The player has ${wins}W/${losses}L …`
```

Three distinct problems, all reachable by any authenticated user:

1. **Cost abuse.** No rate limit, and every cache miss is a paid LLM call. Because the cache key is
   derived from the raw strings, sending a fresh random string each time guarantees a miss — an
   attacker could bill the account's AI budget in a tight loop.
2. **Prompt injection.** `playerChampion` lands in the user prompt verbatim, so instructions could be
   smuggled in to override the system prompt and make the model emit arbitrary text.
3. **Cache pollution.** Unbounded distinct keys write unbounded rows into the AI cache.

`wins`/`losses`/`avgKda` were also rendered into the prompt with no numeric validation at all — they
are typed `number` on the interface, but the body is cast, not parsed, so a string arrives unchecked.

## Change

**New `src/domains/analysis/services/matchupGuideService.ts`** holds the logic. Both champion names
are resolved against the real Data Dragon roster via the existing `fetchAllChampions()`
(`src/lib/ddragon/championsData.ts`, already cached 24h) before anything else happens. An
unrecognised name throws `UnknownChampionError` and never reaches the model or the cache.

That single control closes all three problems at once: the input space collapses from "any string" to
"one of 173 known champions", so prompt injection is impossible, cache keys are bounded at
173 × 173 pairs, and a miss can only be a legitimate matchup.

Names are canonicalized to Data Dragon's spelling before building the cache key, so `kai'sa`,
`KAI'SA` and `Kai'Sa` share one cache entry instead of minting three paid calls.

`wins`/`losses` are clamped to `0..10000` and truncated to integers; `avgKda` is clamped to `0..100`.
Non-finite values become `0`. These are malformed-client values, not attacks, so they are clamped
rather than rejected.

**`app/api/analysis/matchup-guide/route.ts`** is now validate → delegate → respond per CLAUDE.md §2.2,
and gained a rate limit of **20/hour keyed by `userId`**. The key is the user, not the IP — an IP key
would let one account spend from many addresses, which is the exact abuse being prevented. It follows
the existing `checkRateLimit`/`rateLimitResponse` idiom from
`app/api/analysis/daily-momentum/route.ts`.

## Tests

`matchupGuideService.test.ts` — 13 tests: happy path, cache hit (asserts the AI provider is **not**
called), unknown player/opponent champion, a prompt-injection payload proving no AI call is made,
case-insensitive matching with canonicalization, one cache key across casing variants, and clamping
of negative / absurd / non-finite / fractional numerics.

## Verification

`npx vitest run src/domains/analysis/services/matchupGuideService.test.ts` — 13 passed.
Full suite green; `tsc --noEmit` and ESLint clean.

refs TASK-253
