# TASK-187: Tool Depth — Counter/Matchup/Draft Upgrades

## Status: Pending
## Score: 90/100

## Goal
Bring the existing tools to best-in-class detail using the new build/curve data.

## Scope
- `/counters/[champion]`: game-length curve, patch-trend sparkline, 150+ word generated
  "how to play vs X" (real numbers + DDragon enemy tips), rank-tier filter (noindex
  query), link to the build page.
- Counter-picker tool: per-champion "view full counter guide →"; matchup rows link to
  /matchups pages when available.
- Draft analyzer: replace tag-heuristic `scalingLean` with REAL aggregated game-length
  curves per team (chart both teams' win rate by duration; tags only as fallback).
- Matchup tool: each side's core items/runes mini-summary + overlaid game-length curves
  (reuse build components).
- Update affected unit tests.

## Commit
`feat(tools): game-length curves, trends and deeper counter/matchup/draft detail`
