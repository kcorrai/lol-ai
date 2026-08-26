# ADR-045: Server-side fetches ask for `no-cache`, never `no-store`

## Status: Accepted

## Context

The Neon transfer allowance (5 GB/month) was being exhausted in two or three deploys. This
is the fourth time the allowance has driven a decision — TASK-282 added a process memo,
ADR-013 added a shared Data Cache, ADR-014 moved the AI cache into Redis. All three are in
place, all three work, and all three work **only at runtime**.

None of them work during `next build`, for one reason.

`@upstash/redis` issues every command as a `fetch` with `cache: "no-store"` — its default,
and configurable. `opggFetch`, `esportsFetch` and `fetchJsonLastGood` pass the same option
deliberately, for the reasons ADR-034 records. Next throws on exactly that during static
generation (`next/dist/server/lib/patch-fetch.js`):

```js
if (!staticGenerationStore.forceStatic && cache === "no-store") {
    const dynamicUsageReason = `no-store fetch ${input} ...`;
    throw new DynamicServerError(dynamicUsageReason);
}
```

Every layer we built catches that throw and reads it charitably, because from where each of
them sits it is indistinguishable from the thing it was written to survive:

- `redisCacheGet` reports it as a cache miss, so `getCached` falls through to
  `prisma.aiCache.findUnique` — **a Neon read of a large JSON blob**.
- `cachedResource` and `cachedComputation` report it as a feed failure and fall back to
  `:last-good`, which by ADR-014's 90-day rule lives only in Postgres — **a second one**.

So each of the ~739 prerendered pages paid up to two full-blob Neon reads on every build,
where it should have paid none. Preview deployments build identically, and most deployments
on this project are previews.

The build log of `dpl_5eTPpzSxJvod8B3abuBytXwNT9vL` (production, 2026-08-16) carries
30 `Redis read failed for esports:teams:fresh` and 69 `DYNAMIC_SERVER_USAGE` entries **in
its last seventy lines**, and Vercel truncated it at the 4 MB cap. No `meta:snapshot`
failure appears anywhere in it, which fits and is the tell: that one path is wrapped in
`unstable_cache`, and a fetch inside a cached scope never reaches the throw.

Half of this was diagnosed a week earlier and fixed one route wide. `fb3dbea` says it
plainly — "esportsCache reaches Redis over a no-store fetch that a static export refuses
outright — so every read misses and every fallback walks the live feed" — and then routes
`/sitemap.xml` around the symptom. The sentence was right about the whole application.

## Decision

No server-side `fetch` asks for `cache: "no-store"`. They ask for `cache: "no-cache"`.

The two are the same instruction to the framework. `patch-fetch` maps both to
`revalidate: 0`, and a response with `revalidate: 0` is never written to the Data Cache. The
difference is that only `no-store` reaches the throw. Nothing about what crosses the network
changes, and every reason written in ADR-034 and at each call site still holds — this does
not reintroduce `next: { revalidate }`, which remains banned against a host we do not
operate.

The rule stops at the server boundary. A client component renders in the browser, where the
patched fetch is not involved and `no-store` is the plainer, more accurate HTTP directive;
`app/overlay/[key]/[widget]/OverlayClient.tsx` keeps it.

`src/lib/http/noStore.lock.test.ts` enforces this by walking the tree, in the shape of
`src/lib/uiLocale.lock.test.ts`. A lock rather than a review note, because this failure is
silent by construction: the build goes green, the pages render correctly, and the only
symptom is the bill. It exempts client components by reading their `"use client"` directive
rather than by a list, and its regex matches the fetch init key only — a response header
that says `Cache-Control: no-store` is a different thing and is correct where it appears.

## Consequences

**The build stops reading Neon.** Redis answers during static generation, so `getCached`
returns before the Postgres fallback, and the feeds answer, so `cachedResource` never
reaches `:last-good`. The per-deploy spike this ADR exists to remove has no path left.

**ADR-013 and ADR-014 become true of builds as well as requests.** Both were written as if
the caching they installed applied everywhere. It did not, and the gap was invisible from
inside either document.

**`no-store` is now a thing you cannot write without the suite objecting.** That is the
point, and it will occasionally be an inconvenience — a genuinely browser-only fetch in a
server file would have to be argued for. There is currently no such call.

**The Redis client's default is a trap for the next dependency too.** Nothing stops another
library from doing what `@upstash/redis` does inside its own fetch, and the lock cannot see
into `node_modules`. What would catch it is the same evidence that caught this one: a
`DYNAMIC_SERVER_USAGE` line in a build log is never noise.

## Alternatives rejected

**Wrap every Redis read in `unstable_cache`.** This is what accidentally shielded the meta
snapshot, so it demonstrably works. It is also caching a cache: a second TTL over entries
that already have one, in a layer that cannot be busted by `deleteCached`, for a store whose
entire job is to be the fast shared copy.

**Set `export const dynamic = "force-static"` on the affected routes.** The throw is guarded
by `!staticGenerationStore.forceStatic`, so this silences it. It also silences it for every
genuinely dynamic read on those pages, which is a much larger promise than the one being
made here, and it would have to be repeated on every page that ever reaches a cache.

**Stop prerendering the pages.** Treats the symptom. The build is not wrong to prerender 739
pages; it is wrong that prerendering one costs a database read.
