# TASK-213: Make the product-demo "scan" step realistic

## Status: Done

## Goal

The demo's "analyzing last 20 matches" step looked fake (plain coloured bars).
Show a realistic, slightly-exaggerated match history.

## Scope

- `ProductDemoSteps.tsx` StepScan: real match rows via `ChampionIcon`
  (Yasuo/Ahri/Zed/LeeSin) with role, K/D/A, KDA ratio + CS, and colour-coded
  WIN/LOSS pills + win/loss left border; staggered row entrance; a sweeping
  "analyzing" progress bar.

## Tests

tsc + lint + 352 tests green; verified visually (real champion icons + stats).

## Commit

`feat(landing): realistic match history in the product-demo scan step`
