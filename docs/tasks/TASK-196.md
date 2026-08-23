# TASK-196: Counter Picker — fix data holes + wire personal matchups

## Status: Done

## Goal

Fix the counter picker's public bugs and surface the fully-built-but-orphaned
personal matchup feature (backend existed, no UI consumed it).

## Scope

Public bugs (`counterService.ts`, `CounterPickerControls.tsx`, both pages):

- D1: on champion change, reset the lane (`navigate(next, null, tier)`) so the URL
  never keeps a role the new champion doesn't play.
- D2: an exact 50.0% matchup no longer drops from both columns (`>= 50` on the
  favourable side).
- D3: opponents op.gg lists but the snapshot omits now resolve via a Data Dragon
  fallback merged into the champion index, instead of silently vanishing.
- G2 parity: rank-bracket pills on the tool page (thread `tier` into
  `getCounterData`); lane pills on `/counters/[champion]` (thread `role`), both
  filters preserved across each other; lane-filtered views set `robots:noindex`.

Personal matchups (`PersonalMatchupPanel.tsx`, new):

- Client island that brings its own `QueryProvider` (public tools layout has none),
  reads the session + first Riot account, calls `usePersonalMatchups`, and renders
  best/worst matchups, ban suggestion and trend. Hidden for anonymous visitors,
  prompts to connect when signed-in with no linked account. Rendered on the
  counter-picker page under the meta counters.

## Tests

- `counterService.test.ts`: 50.0% boundary retained; snapshot-miss opponent
  resolved via Data Dragon fallback (fetchAllChampions now mocked).

## Commit

`fix(counter): patch data holes and wire the personal matchup panel`
