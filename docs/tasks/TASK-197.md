# TASK-197: Matchup Analyzer — lane selector, honest sample, fuller build

## Status: Done

## Goal
The matchup analyzer felt very incomplete: the lane selector was dead, most
pairings showed a fabricated 50%, and the build summary was thin.

## Scope
- `matchupService.ts`:
  - D1: `MatchupReport.availablePositions` now carries the lanes both champions
    share; `resolvePosition` returns them for the lane selector.
  - D3: a requested lane is honored only when both champions share it; otherwise
    it falls back to the most-played shared lane (never queries a lane one
    champion doesn't play).
  - G3: lane tips now lead with the actual win-rate edge when the sample is real
    (≥100 games), not just static Data Dragon traits.
- `matchup/page.tsx`: pass `report.availablePositions` so the lane pills light up.
- `MatchupReportCard.tsx`: D2 — when `games === 0`, show "—/Not enough games"
  instead of a fake 50%; add an opposed both-directions win-rate bar (G2).
- `MatchupCurveCompare.tsx`: D4 — walk the union of fixed buckets with a
  placeholder for a missing side instead of dropping rows; render if either curve
  exists.
- `loadMatchupExtras.ts` + `MatchupBuildSummary.tsx`: G1 — surface summoner
  spells, boots, skill max order and situational item options, not just keystone +
  core items.

## Tests
- `matchupService.test.ts`: shared-lane exposure and requested-but-unshared lane
  falling back to a shared lane.

## Commit
`fix(matchup): restore lane selector, drop fake 50%, enrich the build`
