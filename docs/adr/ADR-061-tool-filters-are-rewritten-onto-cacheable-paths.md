# ADR-061: Tool filters are rewritten onto cacheable paths

## Status: Accepted

## Context

ADR-059 made the tool pages static, except the three that read search params:
`/counters/[champion]` (`?tier`, `?role`), `/tools/tier-list/[role]` (`?tier`, `?region`) and
the `/tools/tier-list` hub (legacy `?role`). A page that reads search params is rendered per
request. The load test (`npm run load:test`, local production build, 50 concurrent visitors)
put those pages at ~3 s p50 and ~6 s p99 while every cached page answered in under 20 ms, and
they held the whole server to ~87 requests a second.

The filters are public, linked from the pages themselves, and meant to stay as query strings:
changing the visible URLs would move every shared and indexed link.

## Decision

- Middleware rewrites a filtered request onto an internal path that carries the filters as
  segments: `/counters/Jhin?tier=emerald_plus` is served by `/counters/Jhin/f/emerald_plus/any`,
  `/tools/tier-list/top?tier=diamond_plus&region=euw1` by
  `/tools/tier-list/top/f/diamond_plus/euw1`. `any` stands for a filter that is not set.
- The internal routes are ordinary `force-static` pages with the same 12-hour `revalidate`. They
  render by calling the original page component with the filters as its `searchParams`, so there
  is one page, not two to keep in step.
- The original pages become `force-static` too. They never see a filtered request, so the search
  params they still read are always empty.
- Only values the existing parsers accept are rewritten (`parseTier`, `parseRegion`,
  `parsePosition`). A made-up value falls through to the unfiltered static page, exactly as the
  page always ignored it — so the set of cached pages is bounded and cannot be grown from outside.
- A request for an `f/` path directly is answered 404 in middleware.
- The hub's legacy `?role=` redirect moved from the page into middleware (308).
- The mapping lives in `src/domains/meta/toolFilterRoutes.ts`, which imports only the two
  constant modules of the meta domain, never its index — it runs in middleware.

## Consequences

- Same load test after the change: every path 100% cache hits, no errors, p99 under 0.6 s,
  ~196 requests a second on one local process.
- Filtered views are cached per combination the parsers accept — for the tier list 8 tier values
  (including `any`) × 12 regions × 5 roles, for counters 8 × 6 per champion — each built on its
  first visit, never at build time.
- The middleware matcher now includes `/tools/tier-list` and `/counters`. It returns before the
  session read for them, so they cost no token verification.
- Filtered pages keep their `noindex` and their canonical to the clean page; that came from the
  page's own `generateMetadata`, which the internal route calls with the same filters.
- `app/(tools)/renderMode.lock.test.ts` treats a page with an `f/` directory beside it as static.

## Extension: esports

The same rewrite now covers the three esports pages that read search params, which the
50-visitor load test put at ~2.3 s p50 and which halved the whole server's throughput:

| Visible URL                                 | Served by                                     |
| ------------------------------------------- | --------------------------------------------- |
| `/esports/matches/[id]?g=2`                 | `/esports/matches/[id]/f/2`                   |
| `/esports/champions?league=…&sort=…&role=…` | `/esports/champions/f/[league]/[sort]/[role]` |
| `/esports/vods?league=…&show=…`             | `/esports/vods/f/[league]/[show]`             |

- `g` is rewritten only for 1–5; `sort` only when it is the non-default `winRate`; `show` is
  rounded up to whole pages of 40 and refused past 2000.
- League values cannot be checked against the feed from middleware, so they are held to a strict
  shape there, and the internal route answers 404 to one that matches the shape but names no
  league. A made-up league therefore cannot mint a cached copy of the page.
- The shared pieces (`ANY`, the `f` segment, encoding a value as a segment) moved to
  `src/lib/routing/filterRewrite.ts`; the esports mapping is `src/domains/esports/esportsFilterRoutes.ts`.
- The match page's `revalidate` drops from an hour to five minutes. It decides server-side whether
  a game is unstarted, live or finished and whether to offer the live broadcast, and a cached copy
  should not lag a live series by an hour. The live stats themselves are polled in the browser.
- Same load test after, across tools and esports: every path 100% cache hits, no errors, p99 under
  0.9 s, ~109 requests a second on one local process (the esports pages are heavier HTML).
