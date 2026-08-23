# TASK-193: Tier List — flag low-confidence (Challenger) samples

## Status: Done

## Goal

The Challenger rank bracket is a tiny sample (~2.4k games), so op.gg pins S/A
tiers on 15-30 game noise (e.g. a "28% win rate S-tier"). The filter was pick-rate
only, with no absolute sample-size guard, so the Challenger view looked broken.

## Scope

- `tierListService.ts`: add `games` + `lowConfidence` to `TierListEntry`
  (threshold `MIN_CONFIDENT_GAMES = 200`; mainstream brackets never trip it
  because every shown champion already has thousands of games). Sort sinks
  low-confidence rows below all trustworthy rows, ordered by sample size so the
  most-played champions surface first instead of random noise. ARAM entries carry
  games too.
- `TierRow.tsx`: show a compact games count under the champion name and grey out
  the tier badge (with a tooltip) when low-confidence.
- `TierListView.tsx`: banner when a bracket is majority low-confidence.

## Tests

- `tierListService.test.ts`: a 28-game "S-tier" is flagged low-confidence and
  sinks below every confident row; confident rows stay unflagged.

## Commit

`fix(tier-list): flag and sink low-confidence Challenger samples`
