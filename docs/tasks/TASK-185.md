# TASK-185: Tier List Upgrades — Role Hubs, Rank Filter, Patch Movement

## Status: Done
## Score: 90/100

## Goal
Convert the tier list into an internal-linking hub system with path-based role pages
(research: params = crawl bloat, paths win) and rank filtering.

## Scope
- `app/(tools)/tools/tier-list/[role]/page.tsx` for top/jungle/mid/bot/support;
  `?role=` 308-redirects to the path. Role-specific titles ("LoL Top Lane Tier List —
  Patch 26.13"), ~100-word data-driven role blurb, ItemList JSON-LD.
- Rank filter UI via `?tier=` (gold_plus…challenger) using the tier-aware snapshot;
  generateMetadata sets `robots: { index: false }` + canonical to the path page when
  the tier param is present.
- Patch movement column (▲/▼ n) from `rank_prev_patch` vs `rank`.
- Link ARAM tier list tab; sitemap adds the 5 role hubs.

## Commit
`feat(tools): role tier-list hubs, rank filter and patch movement`
