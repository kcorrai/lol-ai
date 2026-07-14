# TASK-167: Counter Tool Rework — /tools/counter-picker (Public, Data-Driven)

## Status: Pending
## Score: 90/100

## Goal
Replace the AI-powered counter tool with a public, zero-cost, data-driven
counter picker fed by the meta domain (TASK-166). English UI, SEO-ready.

## Scope
- `src/domains/meta/services/counterService.ts` — best counters per champion+role
  from op.gg counters (min sample threshold, win-rate sort), enriched with DDragon
  champion data; salvage useful editorial tips from
  `src/domains/counter/data/counters/*` (translated to English)
- New page `app/(tools)/tools/counter-picker/` — RSC + small client picker,
  English copy, `generateMetadata`, FAQ JSON-LD, CTA to AI coaching (/register)
- Delete AI path: `app/api/counter/route.ts` + AI code in `src/domains/counter/`,
  remove old page `app/(app)/counter/` (grep for imports/links first)
- Unit tests for counterService

## Out of Scope
- Per-champion SEO pages (TASK-172)
- Middleware/nav changes (TASK-171)

## Commit
`feat(tools): public data-driven counter picker at /tools/counter-picker`
