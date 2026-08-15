# TASK-297: Draft engine — sequence, state machine, legality rules

Spec: `docs/DRAFT_ROOM.md` §2, §3, §5.

## Goal

A pure, dependency-free core for the live draft room. No Prisma, no fetch, no
React. Everything the server and the client both need to agree on lives here, so
the optimistic client echo and the authoritative server write run the *same code*
and cannot disagree.

## Deliverables

`src/domains/draft/engine/`

- `draft.types.ts` — `DraftSide`, `DraftActionType`, `SeriesMode`, `DraftStep`,
  `DraftActionState`, `DraftGameState`, `DraftSeriesState`, `LegalityResult`.
- `sequence.ts` — the frozen 20-step `DRAFT_SEQUENCE` from §2, plus
  `stepAt(index)`, `isBanStep`, `slotIndexFor(step)` (which of the five ban/pick
  slots on that side the step fills).
- `lockouts.ts` — `computeLockedChampions(series, gameNumber)` implementing
  `NORMAL` / `FEARLESS` / `TEAM_FEARLESS`, returning a per-side `Set<string>`.
- `legality.ts` — `canSelect(state, side, championKey)` → `LegalityResult`
  (`{ ok: true }` or `{ ok: false; reason }` where reason is one of
  `not-your-turn` / `draft-not-running` / `already-used` / `series-locked` /
  `disabled` / `unknown-champion`).
- `reducer.ts` — `applyAction`, `applyReady`, `applyUndo`, `resolveTimeout`.
  Every function takes a state and returns a **new** state; none of them mutate.
- `timing.ts` — `turnDeadline(state)`, `remainingMs(state, now)`,
  `hasExpired(state, now)`. `now` is always an injected argument, never
  `Date.now()` read inside.

## Rules the tests must pin down

1. The sequence is exactly the table in §2 — 20 steps, 10 bans, 10 picks, 5 of
   each per side.
2. A champion picked or banned in the current game can never be selected again in
   that game, by either side.
3. `FEARLESS` locks earlier-game picks for both sides; `TEAM_FEARLESS` locks them
   for the owning side only; `NORMAL` locks nothing across games.
4. Bans never carry across games in any mode.
5. Acting out of turn, acting before both sides are ready, and acting after the
   draft is complete all fail with the specific reason.
6. A disabled champion is rejected and is *not* treated as banned.
7. `applyUndo` steps back exactly one action and restores that champion to the
   pool; undoing at step 0 is a no-op.
8. `resolveTimeout` is deterministic: called twice with the same state and the
   same `now`, it yields an identical result.
9. A completed game advances the series; a completed final game completes the
   series.

## Constraints

- No file over 150 lines. Split by the file list above.
- No `any`. Explicit return types everywhere.
- `engine/` must not import from `services/`, Prisma, or anything under `app/`.

## Done when

`src/domains/draft/engine/*.test.ts` covers all nine rules above and
`npm run test -- src/domains/draft` is green with ≥90% line coverage on the
engine directory.
