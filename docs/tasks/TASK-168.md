# TASK-168: Matchup Tool Rework — /tools/matchup (Public, Data-Driven)

## Status: Pending
## Score: 88/100

## Goal
Replace the AI matchup analyzer with a public, data-driven head-to-head tool.

## Scope
- `src/domains/meta/services/matchupService.ts` — head-to-head from both champions'
  counter arrays (win rate both directions, sample size), lane-phase hints derived
  from DDragon stats (attack range diff, base stats, scaling), template-based
  English output
- New page `app/(tools)/tools/matchup/` — two-champion + role picker, results RSC/client
  calc over server-passed data, `generateMetadata`, CTA to AI coaching
- Delete `app/api/matchup/analyze/route.ts` + old page `app/(app)/matchup/`
- Unit tests for matchupService

## Out of Scope
- Nav/middleware (TASK-171)

## Commit
`feat(tools): public data-driven matchup analyzer at /tools/matchup`
