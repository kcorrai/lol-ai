# ADR-034: Third-party catalogue reads bypass the framework fetch cache

## Status: Accepted

## Context

Every read of a third-party catalogue — Data Dragon's versions, items, champions and
runes, and the op.gg champion feed — went through `fetch(url, { next: { revalidate: N } })`.
That looked like the careful option: one shared cache, honoured across instances, with
the framework doing the refresh.

It is also how an unreachable upstream took whole pages down.

When the cached entry is stale, Next serves it and refreshes it **after** the render. If
that deferred refresh rejects, it destroys the response being piped:

```
TypeError: fetch failed
  [cause]: ConnectTimeoutError … ddragon.leagueoflegends.com:443, timeout: 10000ms
⨯ Error: failed to pipe response
GET /esports 500
```

The decisive detail is that **a `catch` at the call site does not help, and every call
site already had one.** `proSampleService` wrapped `fetchItems()` in
`.catch(() => new Map())`; `getLatestDdragonVersion` caught internally and returned the
pinned version. Both still 500'd, because the rejection does not happen at the call site
— it happens in the framework, at response close. Proved by elimination: calling
`getProMeta()` directly under the same conditions succeeds in 21s (it eats one timeout,
catches, returns an empty catalogue); the same call inside a page render 500s.

This defeats the degrade-to-last-good discipline ADR-016 is built on. An upstream being
down was supposed to produce a stale answer or an empty state. Instead it took the page
down _because_ there was a cached copy to refresh.

## Decision

Third-party JSON is read through `fetchJsonLastGood()` (`src/lib/http/lastGoodJson.ts`),
which does not use the framework cache at all. It owns:

- **its own TTL**, in a bounded process-lifetime map;
- **its own timeout** (`AbortSignal.timeout`), so a hung connect cannot hold a request open;
- **last-good retention** — on failure it serves the previous answer _past expiry_, because
  the entry is only stale since we could not reach the host to replace it;
- **in-flight dedup**, reusing the existing `dedup()` helper;
- **a non-rejecting contract** — it resolves to `undefined`, so no caller has to handle a
  thrown error, and no caller's `catch` can be bypassed the way the framework's was.

Two call sites keep their own response shape and only drop `next: { revalidate }` for
`cache: "no-store"` plus a timeout: `opggFetch`, whose callers already sit on the
Redis/Postgres fresh + last-good pair where the caching that matters happens, and the
quiz asset route, which streams a binary body rather than JSON and is cached at the edge
by its own `Cache-Control`.

## Consequences

**The trade is real and accepted.** The framework cache is shared across instances and
survives a cold start; this map is per-instance and does not. N instances each pay one
request per TTL where they used to share one. For catalogues fetched hourly or daily that
is a few requests; a page that 500s is not a few requests.

**Tests that mock `fetch` must now set `ok: true`** — the helper checks the status where
some of the previous code did not — and must clear the memo between cases
(`__clearLastGoodJson()`), because it lives for the process.

**The rule this sets:** no `next: { revalidate }` against a host we do not operate. The
grep that proves it is `grep -rn "next: { revalidate" src app`, which should only ever
match comments explaining why.
