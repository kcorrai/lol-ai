# TASK-309 — SEO layer: JSON-LD, OG cards, sitemap, canonicals

**Phase:** 6 — Esports & Audience Growth
**Status:** Done
**Estimated Effort:** 1 day
**Depends on:** TASK-308 — **not waited for.** The tournament and
champion-in-pro-play clusters (TASK-306–308) do not exist yet, so this sweep
covers the eight page types that do. Those two clusters bring their own JSON-LD,
OG card and sitemap rows when they land.
**Decisions:** [ADR-017](../adr/ADR-017-esports-url-structure.md)

---

## Objective

The section is only worth building if it is indexed correctly. This task is the
sweep that makes every esports page structurally sound, and the point at which
the section's URLs enter the sitemap.

## Scope

- **Structured data** — a small `src/domains/esports/components/EsportsJsonLd.tsx`
  emitting the right type per page rather than hand-rolled objects scattered
  across pages: `SportsEvent` (matches, tournaments), `SportsTeam` (teams),
  `Person` (players), `ItemList` (standings, champion tables, rosters),
  `BreadcrumbList` (everywhere).
- **Breadcrumbs** — a visible trail on every page mirroring the path. The
  section ships `EsportsBreadcrumb` (TASK-299) and the free tools have a
  near-identical `ToolBreadcrumb`; consolidate the two into one shared primitive
  under `src/components/` and move both callers onto it.
- **Dynamic OG cards** — `opengraph-image.tsx` for matches ("T1 vs Gen.G · LCK"),
  teams, players and champion-in-pro-play pages, built on `renderOgImage`.
  Text-only, per the existing helper's constraint.
- **Sitemap** — extend `app/sitemap.ts` with leagues, tournaments, teams, players,
  champion pages and recent matches, computed from the cached indexes and
  **filtered by the has-content predicate** (ADR-017 §4). Matches older than the
  current and previous season are excluded to keep the file sane; older pages stay
  reachable by internal links.
- **Canonicals and noindex** — audit every route: filtered/sorted/paged views set
  `alternates.canonical` to the base path and `robots: { index: false, follow: true }`.
- **Metadata quality** — every page's title and description built from real data
  (team names, tournament, date, sample size), no template with an empty slot.
- **Internal linking** — every page links up (breadcrumb) and down (at least three
  contextual links), so no page in the section is an orphan.

## Acceptance Criteria

- [x] Every esports route type emits valid JSON-LD — parsed out of the live HTML
      on all eight: hub `ItemList`, schedule `ItemList`, leagues index `ItemList`,
      league `ItemList`, teams index `ItemList`, team `SportsTeam`, player
      `Person`, match `SportsEvent`, each with `BreadcrumbList` beside it
- [x] Visible breadcrumbs on every page, matching the JSON-LD trail. The hub is
      the root of the trail and carries none, by design
- [x] OG cards for match, league, team and player pages — each page declares its
      own card route (see the note below on rendering them locally)
- [x] Sitemap includes only pages with content; counts logged during generation.
      Live: 1041 esports URLs — 37 leagues, 412 teams, 190 players, 398 matches
- [x] No filtered, sorted or paged URL is indexable — `?g=2` on a match verified
      `noindex, follow` with the canonical pointing at the base path
- [x] No orphan pages — match pages now link both teams and the league, team
      pages link their league hub and the schedule
- [x] `tsc --noEmit`, lint and tests pass — 1168 tests, 15 of them new

## Notes from the build

- **The thin-page rule needed teeth on players.** Team pages already went
  `noindex` when empty; player pages did not, and most of them are empty — Riot
  publishes per-game livestats for the leagues it promotes and, for most of the
  rest, not at all. A player page now counts its games in `generateMetadata` and
  excludes itself when the answer is zero. Doing the same in the sitemap would
  cost a feed walk per player, so the file uses two cheap proxies instead —
  starters only, in featured leagues only. That one bar took the player rows from
  2422 to 190, and 190 is the honest number.
- **A match has no kickoff time.** `getEventDetails` does not publish one (it is
  why match pages never showed a date), so `SportsEvent.startDate` is resolved
  from the schedule windows the section already caches. Outside that window the
  key is absent rather than invented.
- **One breadcrumb, two shapes.** `ToolBreadcrumb` and `EsportsBreadcrumb` were
  the same component twice. The markup and the `BreadcrumbList` now live in
  `src/components/shared/Breadcrumb.tsx`; `EsportsBreadcrumb` survives as a
  wrapper that prepends the section root, so no esports page can forget it and
  silently orphan itself in the structured data.
- **OG cards could not be rendered on this machine.** `@vercel/og` resolves its
  bundled font through a path that is invalid on Windows
  (`.\file:\C:\...\noto-sans...ttf`), so every OG route 500s in local dev —
  including the pre-existing `/tools` and `/esports` cards this task did not
  touch. What was verified here is that each page declares the right card route
  and alt text; the renderer itself is proven by the tool cards already in
  production.
