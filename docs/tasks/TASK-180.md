# TASK-180: Game-Patch Display Fix (26.13, not 16.13)

## Status: Pending
## Score: 96/100

## Goal
The site displays Data Dragon versions ("16.13") but the real game patch is "26.13"
(Riot's year-based naming since Season 2025; DDragon never adopted it — mapping is
major+10). Data is already current; only the label is wrong.

## Scope
- `src/domains/meta/patch.ts`: `formatGamePatch(version: string): string` —
  "16.13.1"/"16.13" → "26.13"; majors < 15 pass through unchanged. Unit tests.
- Apply to EVERY user-facing patch mention: tier-list (title/H1/metadata), counter-picker,
  matchup, draft-analyzer, `/counters/[champion]` (title + FAQ), OG image routes,
  MetaSnapshotSection, hero counter line.
- Fix `src/domains/analysis/services/patchService.ts` `buildPatchNotesUrl` to game-patch
  format: `league-of-legends-patch-26-13-notes`. Check PatchImpactWidget shows game patch.
- Keep ddragon numbering internal (cache keys, CDN URLs, op.gg trend versions).
- Verify: grep rendered HTML of key pages for `16\.1[0-9]` → zero user-facing hits.

## Commit
`fix(meta): display game patch numbering (26.x) instead of data dragon versions`
