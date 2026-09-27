# ADR-059: Tool pages are forced static

## Status: Accepted

## Context

ADR-008 says every tool page is ISR, and ADR-013 counts on ~739 of them being built once and
revalidated every 12 hours. LA-112 measured that none of them were: a production build served
`/builds/Kaisa` with `Cache-Control: private, no-cache, no-store`. Two separate causes, each
enough on its own:

1. **The `(tools)` layout read the session** to choose between the app shell and the marketing
   chrome (TASK-237). Reading the session is a dynamic read; every page under the layout became
   per-request.
2. **Every `no-cache` fetch in a render sets the page's revalidate to 0.** ADR-045 moved all
   server fetches from `no-store` to `no-cache` on the grounds that the two are "the same
   instruction to the framework" and only `no-store` throws. The second half is true; the first
   is not the whole story. In Next 14.2 `patch-fetch.js`, a fetch with `revalidate: 0` also
   lowers `staticGenerationStore.revalidate` to 0, which makes the route dynamic — no throw, no
   log line, just a page that is never cached. Redis reads, op.gg and esports feeds are all
   `no-cache`, so any tool page touching one of them was dynamic. With cause 1 removed, a local
   build still wrote HTML for 18 pages; with this ADR, 325.

For a site expecting a lot of anonymous traffic this is the difference between serving a tier
list from the CDN and rendering it — snapshot read and all — for every visitor.

## Decision

- The `(tools)` layout no longer reads the session. `ToolsChrome`, a client component, picks
  the chrome from the client session; the server renders the marketing chrome, which is also
  what a crawler should see. The marketing header and footer are still rendered on the server
  and handed in as props.
- Tool pages that take no search params declare `export const dynamic = "force-static"` next to
  their `revalidate`: `/builds`, `/builds/[champion]`, `/builds/[champion]/[role]`,
  `/matchups/[slug]`, `/aram/[champion]`, `/aram/tier-list`, `/meta`, `/tools`.
- ADR-045's rule stands — server fetches still say `no-cache`, never `no-store`. What changes is
  its claim that `no-cache` is harmless to a page: it is harmless to the build, not to caching.

## Consequences

- Measured on `next build` + `next start`: those pages answer `x-nextjs-cache: HIT` with
  `s-maxage` and `stale-while-revalidate`. A champion outside the prerendered set renders once
  on first request and is cached from then on.
- `force-static` makes `headers()` and `cookies()` return empty on those pages. None of them
  reads either today; a future per-visitor read on one of them will silently see nothing, which
  is why the comment sits beside each declaration.
- A signed-in visitor sees the marketing chrome for the moment before the client session loads,
  then the app shell. That is the price of the page being cacheable for everyone else.
- `/counters/[champion]`, `/tools/tier-list` and `/tools/tier-list/[role]` read search params
  and remain per-request — and say so with `export const dynamic = "force-dynamic"`. Left
  implicit, a build whose `generateStaticParams` came back empty (snapshot unavailable) marked
  `/counters/[champion]` static, and every visit then failed with "static to dynamic at runtime";
  the load test in LA-126 found it answering 500 to every request. `app/(tools)/renderMode.lock.test.ts`
  now requires every ISR tool page to declare one mode or the other.
- Measured with `npm run load:test` at 50 concurrent visitors on a local production build: the
  cached pages hold a p50 under 20 ms with no errors, while the two per-request pages sit at
  ~3 s p50 and ~6 s p99. Making them cacheable means moving their filters to the client.
- The esports section had both causes too. Its layout now uses the same client-side chrome
  (`PublicChrome`, shared with the tools), and every esports ISR page declares its render mode,
  enforced by `app/(esports)/renderMode.lock.test.ts`. The rule itself lives in
  `src/test/renderModeLock.ts`.
