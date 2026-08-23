# TASK-243 — Champion builds show all 18 skill levels

## Problem

5.png: the Skill Order grid stopped at level 15, but champions level to 18.

## Cause

Not a rendering bug — the data source is short. Probing op.gg
(`lol-api-champion.op.gg/api/global/champions/ranked/157/MID`) confirms `skills[].order` is
always exactly 15 entries; the component simply rendered what it was given.

## Change

The missing tail isn't a matter of taste, it follows from the levelling rules: a champion spends
5 points each into Q/W/E and 3 into R, with the ultimate unlocking at 6/11/16. op.gg's 15 levels
already contain the R points at 6 and 11, so levels 16-18 are the third R plus whichever basic
abilities are still short of 5.

- `src/domains/meta/services/skillOrder.ts` (new) — pure `completeSkillOrder(order, maxOrder)`.
  Leftover basic points are ordered by the champion's own max priority (Q/W/E as fallback).
  Idempotent, and returns the input untouched when it doesn't fit the standard model (a
  transforming champion, say) rather than padding with invented points.
- `championDetailService.buildFromDetail` — completes the order at parse time, so the domain type
  now genuinely means 18 levels.
- `SkillOrder.tsx` — also calls it before rendering. Builds are cached for up to 30 days
  (last-good), so entries stored before this change would otherwise still render 15; the function
  being idempotent makes the second call a no-op for fresh data.
- `types.ts` — comment corrected from "15-level order".

## Tests

`skillOrder.test.ts` — 15→18 length, R lands on 16, per-champion point budget is never exceeded,
max-order decides leftover ordering, idempotency, empty input, missing max order.
`championDetailService.test.ts` — fixture is now a realistic 15-entry order asserting the
completed 18.

refs TASK-243
