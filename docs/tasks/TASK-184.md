# TASK-184: ARAM Tier List + ARAM Build Pages

## Status: Done
## Score: 90/100

## Goal
20M-game ARAM dataset verified (`/champions/aram` bulk + `/aram/{id}/NONE` detail).
"aram tier list" / "[champion] aram build" are high-volume with weaker competition.

## Scope
- `app/(tools)/aram/tier-list/page.tsx`: ARAM ranking from the aram snapshot (ban rate is
  null in ARAM — handle). Title "ARAM Tier List — Patch 26.13". ItemList JSON-LD.
- `app/(tools)/aram/[champion]/page.tsx`: ARAM build pages reusing TASK-182 components
  with `mode: "aram"` (~174 pages, prerender top ~30, ISR 12h). "X ARAM Build — Patch 26.13".
- Cross-links: ranked tier list ↔ ARAM tier list; champion build ↔ ARAM build; hub card.
- Sitemap additions.

## Commit
`feat(seo): aram tier list and aram build pages`
