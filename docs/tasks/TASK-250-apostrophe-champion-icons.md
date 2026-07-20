# TASK-250 — Missing champion images for apostrophe champions

## Problem
Five champions rendered no image anywhere in the app — icon, splash and loading art all 403'd:
Bel'Veth, Cho'Gath, Kai'Sa, Kha'Zix, Vel'Koz.

`normalizeChampionKey` in `src/lib/ddragon.ts` strips apostrophes but keeps the following letter's
case: `"Kai'Sa"` → `KaiSa`. Data Dragon's actual id is `Kaisa`, so every URL built from a display
name 403'd. `ChampionIcon` caught the error and fell back to a first-letter placeholder, which is
why this read as "some champions have no photo" rather than as a broken image.

## Why apostrophes cannot be handled by a rule
Riot's ids are inconsistent about what happens to the letter after the apostrophe:

| Display name | Data Dragon id | letter after `'` |
|---|---|---|
| Bel'Veth | `Belveth` | lowercased |
| Cho'Gath | `Chogath` | lowercased |
| Kai'Sa | `Kaisa` | lowercased |
| Kha'Zix | `Khazix` | lowercased |
| Vel'Koz | `Velkoz` | lowercased |
| Kog'Maw | `KogMaw` | **kept** |
| Rek'Sai | `RekSai` | **kept** |
| K'Sante | `KSante` | **kept** |

There is no rule that separates the two groups, so any regex would fix one group and break the
other. All eight are listed explicitly in `CHAMPION_KEY_OVERRIDES` instead — including the three
that already happened to work, so a future edit to the fallback regex cannot silently break them.

## Change
`src/lib/ddragon.ts` — `CHAMPION_KEY_OVERRIDES` gains the eight apostrophe champions. The fallback
regex is unchanged; it still handles spaces and dots (`Dr. Mundo` → `DrMundo`, `Lee Sin` → `LeeSin`).

No call-site changes: `championIconUrl`, `championSplashUrl` and `championLoadingUrl` all route
through `normalizeChampionKey`, so one edit covers every surface that shows champion art.

## Tests
`src/lib/ddragon.test.ts` — new. Covers all eight apostrophe champions, the pre-existing overrides
(Wukong, Nunu & Willump, Renata Glasc, LeBlanc, Fiddlesticks), space/dot names, plain names, and
asserts the built icon URL for a previously broken champion.

Guard test: `normalizeChampionKey` is run against every champion in a checked-in snapshot of Data
Dragon's `champion.json` id list, asserting the output equals the id for all 173 champions. A new
champion with an unmapped apostrophe fails the suite instead of shipping a blank icon.

## Verified
All 173 ids checked against live Data Dragon 16.13.1: 173/173 resolve. The five previously broken
icon URLs return 200 with the corrected keys (403 before).

refs TASK-250
