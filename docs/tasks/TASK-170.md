# TASK-170: Tier List Tool — /tools/tier-list (New)

## Status: Pending

## Score: 90/100

## Goal

New free SEO tool: role-based champion tier list for the current patch,
built entirely from cached op.gg data. High-volume search target ("lol tier list").

## Scope

- `src/domains/meta/services/tierListService.ts` — role-based tier grouping from
  op.gg tier/rank/win/pick/ban data
- Page `app/(tools)/tools/tier-list/` — ISR (revalidate 6-12h), role tabs,
  champion rows with win/pick/ban rates, patch number from dynamic DDragon version,
  `generateMetadata` ("LoL Tier List — Patch X.Y"), ItemList JSON-LD
- Unit tests for tierListService

## Out of Scope

- Historical tier tracking, per-rank-bracket filtering

## Commit

`feat(tools): tier list tool at /tools/tier-list`
