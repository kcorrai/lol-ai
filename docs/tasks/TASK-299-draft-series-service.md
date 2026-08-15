# TASK-299: Draft series service and Redis read model

Spec: `docs/DRAFT_ROOM.md` §3–§5, ADR-016. Depends on TASK-297, TASK-298.

## Goal

The only layer that talks to Postgres about drafts. It turns rows into the engine
state, runs an engine transition, writes the result back in one transaction, and
mirrors the new state into Redis so reads never hit the database.

## Deliverables

`src/domains/draft/services/`

- `draftRepository.ts` — row ⇄ state mapping. `loadSeriesState(code)`,
  `insertSeries(input)`, `persistTransition(code, gameNumber, next, expectedVersion)`.
  `persistTransition` runs in `prisma.$transaction` and fails loudly on a version
  mismatch so two simultaneous locks cannot both win.
- `draftStateCache.ts` — `readState(code)`, `writeState(code, state)`,
  `invalidate(code)` over `src/lib/cache/redisCache`. TTL matches series
  expiry. A miss falls through to Postgres and re-primes the key.
- `draftSeriesService.ts` — the public API:
  - `createSeries(input)` — validates, mints `code`/`blueToken`/`redToken`,
    creates the series and all `gameCount` games in one transaction.
  - `getSeriesState(code)` — Redis first, Postgres fallback.
  - `resolveViewer(state, token)` — `{ role: "BLUE" | "RED" | "SPECTATOR", team }`.
  - `setReady(code, gameNumber, side, ready)`
  - `submitAction(code, gameNumber, side, championKey)`
  - `undoAction(code, gameNumber, side)`
  - `setGameResult(code, gameNumber, winnerSide)`
  - `setBlueTeam(code, gameNumber, team)` — pre-lobby side assignment.

Every mutating call: load state → run the engine → persist → write cache → return
the new state. Timeout resolution (§5) runs on load, before the requested
transition, so a stale turn is settled before anything else happens.

## Rules

- Nothing in `services/` re-implements a rule that lives in `engine/`. If a check
  is missing, it goes in the engine and the service calls it.
- `submitAction` and `undoAction` verify the caller's side against the engine's
  current turn — never against a value the client sent.
- Token comparison uses `crypto.timingSafeEqual`, not `===`.
- Service file stays under 250 lines; split by sub-domain if it grows.

## Done when

`draftSeriesService.test.ts` covers, with Prisma and Redis mocked: create →
ready → full 20-step draft → complete; out-of-turn rejection; version-conflict
rejection; fearless lockout carrying into game 2; timeout auto-lock on load;
spectator resolution for an unknown token. Coverage ≥80% on `services/`.
