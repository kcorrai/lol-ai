# TASK-191: Builds — fix stat shard icons + add champion search

## Status: Done

## Goal
Two Builds issues: the stat-shard icons (Attack Speed, Health Scaling, and all
others) were broken images, and the builds hub had no way to search for a
champion.

## Scope
- `runesData.ts`: the `rcp-fe-lol-perks` Community Dragon image path 404s for
  every stat shard. Point `SHARD_BASE` at
  `https://raw.communitydragon.org/latest/game/assets/perks` (verified HTTP 200
  for all 9 shards). Host already CSP-whitelisted (`next.config.mjs`).
- `builds/BuildSearch.tsx` (new client component): renders `ChampionCombobox`
  and routes to `/builds/[key]` on select.
- `builds/page.tsx`: render `BuildSearch` in the header.

## Tests
- Manual: `/builds/<champ>` shard row now shows icons; verified all 9 shard URLs
  return 200 and the old path returns 404. Search box navigates to the build.

## Commit
`fix(builds): repair stat shard icons and add champion build search`
