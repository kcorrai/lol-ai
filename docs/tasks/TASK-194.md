# TASK-194: Patch Meta Report — depth + freshness-strip fix

## Status: Done

## Goal
Enrich the patch meta report (thin: names + rank delta + WR/PR only) and fix a
freshness-strip rendering bug.

## Scope
- Defect: `{report.matchCount && (...)}` rendered a literal "0" when the feed
  returns 0. Replace the hand-rolled strip with the existing `DataFreshness`
  component (correct ternary + dedups `hoursAgo`).
- `patchMetaService`: add `banRate` + `games` to `MetaMover` (data already on the
  snapshot).
- `MoverList`: S/A/B tier badge (reusing `tierLetter`), ban rate, and sample size
  per row; empty-state copy per column.
- `page.tsx`: add a fallers `ItemList` to JSON-LD (was climbers-only); add a
  "how this is calculated" methodology note.
- `metaReportText`: add a ban-target question and a methodology question to the
  FAQ. Note: op.gg exposes no previous-patch win rate, so copy stays framed as
  rank movement, not win-rate change.

## Tests
- `patchMetaService.test.ts` (new): climber/faller split, sub-threshold drop, and
  tier/banRate/games carried onto movers.

## Commit
`feat(meta): enrich patch report with tiers, ban rate, sample size and fix strip`
