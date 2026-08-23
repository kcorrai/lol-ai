# TASK-181: Meta Data Expansion — Builds, ARAM, Rank Tiers, Item/Rune Catalogs

## Status: Pending

## Score: 95/100

## Goal

Unlock the rest of the op.gg data (verified live): full champion builds, ARAM mode,
rank-tier filters — the data backbone for build pages, ARAM pages, and deeper tools.

## Scope

- `metaStatsService`: support `mode: "ranked" | "aram"` and `tier` (all|gold_plus|
  platinum_plus|emerald_plus|diamond_plus|master_plus|challenger) on bulk snapshot +
  detail endpoints; cache keys include mode+tier; ARAM detail position = `NONE`.
- New `getChampionBuild(championId, position, {mode, tier})` → `ChampionBuild` type:
  runePages (primary/secondary rune ids + stat shards, win/pick), coreItems (3-item
  combos), boots, starterItems, lastItems (4th/5th options), summonerSpells,
  skillOrder (15 levels) + skillMax (e.g. Q→W→E), gameLengths (win rate by duration
  bucket), trends (per-patch WR + rank). Zod-validated, 12h + last-good fallback.
- New `src/lib/ddragon/itemsData.ts` + `runesData.ts`: cached `item.json` /
  `runesReforged.json` catalogs (id → name/icon/short desc) + rune icon URL helper.
- Tests: happy path, malformed → last-good, ARAM mode, tier param, catalog mapping.

## Out of Scope

- UI (TASK-182+)

## Commit

`feat(meta): champion build data (runes/items/skills/curves), aram mode, rank tiers`
