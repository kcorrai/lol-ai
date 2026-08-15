# TASK-309 — SEO layer: JSON-LD, OG cards, sitemap, canonicals

**Phase:** 6 — Esports & Audience Growth
**Status:** Planned
**Estimated Effort:** 1 day
**Depends on:** TASK-308
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

- [ ] Every esports route type emits valid JSON-LD (validated with Google's Rich
      Results test on one page of each type)
- [ ] Visible breadcrumbs on every page, matching the JSON-LD trail
- [ ] OG cards render for match, team, player and champion pages
- [ ] Sitemap includes only pages with content; count logged during generation
- [ ] No filtered, sorted or paged URL is indexable; canonicals verified
- [ ] No orphan pages — every generated URL is linked from at least one other page
- [ ] `tsc --noEmit`, lint and tests pass
