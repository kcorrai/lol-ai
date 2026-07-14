# TASK-169: Draft Analyzer Rework — /tools/draft-analyzer (Public, Stats-Based)

## Status: Pending
## Score: 85/100

## Goal
Replace the AI draft analyzer with a deterministic stats-based comp evaluator.

## Scope
- `src/domains/meta/services/draftEvalService.ts` — deterministic scoring:
  damage profile (AD/AP mix via DDragon `info.attack/magic`), frontline score
  (`info.defense` + tags), meta strength (op.gg tier/win rate per position),
  per-lane matchup edges (counters data), template-based English verdicts.
  Clearly label output "stats-based analysis".
- New page `app/(tools)/tools/draft-analyzer/` — client-side 5v5 team builder,
  calc via server action or client over passed data, CTA to AI coaching
- Delete `app/api/draft/analyze/route.ts` + old page `app/(app)/draft/`
- Unit tests for draftEvalService

## Out of Scope
- Nav/middleware (TASK-171)

## Commit
`feat(tools): public stats-based draft analyzer at /tools/draft-analyzer`
