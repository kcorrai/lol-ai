# TASK-308 — Champion-in-pro-play pages with pro builds

**Phase:** 6 — Esports & Audience Growth
**Status:** Planned
**Estimated Effort:** 1.5 days
**Depends on:** TASK-307

---

## Objective

`/esports/champions/[champion]` — the single highest-intent page in the section.
"faker azir build", "pro build jinx", "who plays azir in pro play". It is also the
handoff point: someone reading a pro's build on a champion is one click from our
own ranked build page and two from the product.

## Scope

- **`src/domains/esports/services/proBuildService.ts`**
  - From completed games' final frames (already cached by `gameStatsService`):
    per champion, the item builds and rune pages pros actually finished with,
    grouped by frequency, with the player, team, opponent and match link for each.
  - Most-common core items in build order (first three completed items, by
    frequency), most-common keystone + secondary tree, summoner spells.
  - Item and rune identity resolved through the existing
    `src/lib/ddragon/itemsData.ts` / `runesData.ts` loaders — no new asset source.
  - Cached 24 h per champion + scope; only games from the current patch range are
    included, and the range is displayed.
- **`app/(esports)/esports/champions/[champion]/page.tsx`** — `revalidate = 86400`:
  - Header: champion portrait, pro presence/pick/ban/win rate this split.
  - **Pro builds** — the aggregate build (items, runes, spells, skill order where
    derivable) with the sample size.
  - **Recent pro games on this champion** — player, team, result, KDA, build,
    linking to player and match pages.
  - **Top players on this champion** — by games, linking to player pages.
  - **Cross-links, prominent:** `/builds/[champion]` ("what wins in ranked"),
    `/counters/[champion]`, `/champions/[champion]`. The contrast between the pro
    build and the ranked build is the interesting content — show both numbers.
  - Champions with no pro games this split: honest empty state, `noindex, follow`,
    still linking to the ranked build page.
- `generateStaticParams` for champions with pro games; others render on demand.

## Acceptance Criteria

- [ ] Pro build aggregation matches a hand-checked sample of three games
- [ ] Items, runes and spells render with correct icons and names
- [ ] Patch range and sample size stated; stale-patch games excluded
- [ ] Zero-pro-play champions render an empty state and are `noindex`
- [ ] Cross-links to `/builds`, `/counters`, `/champions` present and correct
- [ ] `ItemList` JSON-LD for top players; breadcrumbs esports → champions → champion
- [ ] Unit tests: build frequency aggregation, rune page grouping, patch filter
- [ ] Service under 250 lines; page split into sub-components under 200
- [ ] `tsc --noEmit`, lint and tests pass
