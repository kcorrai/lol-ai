# TASK-269 — Wrap multi-step writes in transactions

## Status: Done

`docs/BACKLOG-SCORED-2026-07-20.md` finding #9 (score 58).

## Problem

Two flows perform a sequence of writes where the second is not guaranteed to happen. Both fail
silently and leave state that cannot be repaired without manual intervention.

**1. Challenge completion vs XP award** — `challengeProgressService.ts:88-96` marks the challenge
complete, then calls `awardXp` as a separate statement. If the XP write fails, the challenge is
permanently marked complete and the reward is never granted. The user sees a completed challenge and
no XP, and there is no record that anything went wrong. `awardXp` is itself two writes (increment,
then a conditional level update), so a failure between them leaves XP granted at a stale level.

**2. Account disconnect vs primary promotion** — `accountService.ts:118-132` deletes the account and
then promotes another to primary in a separate update. If the promotion fails the user is left with
**no primary account**, which the rest of the application assumes cannot happen.

## Approach

Interactive `prisma.$transaction(async (tx) => …)`, the pattern already used in
`teamRepository.ts:30` and `matchSyncService.ts:90`. `awardXp` takes a `tx` so both of its writes
join the same transaction.

One transaction **per challenge**, not one wrapping the whole loop — a failure on one challenge
should not roll back the challenges already processed in that run.

## Scope

- `src/domains/analysis/services/challengeProgressService.ts` — `checkAndUpdateChallengeProgress`,
  `awardXp`.
- `src/domains/riot/services/accountService.ts` — `disconnectAccount`.

`connectAccount` in the same file was handled separately in TASK-267 (different function, different
defect).

## Tests

Neither service has any tests today.

- `challengeProgressService.test.ts` (new) — the update and the XP award happen on the same client;
  a failing XP write propagates so the transaction rolls back rather than leaving the challenge
  complete; an incomplete challenge awards no XP; the loop continues past a failed challenge.
- `accountService.test.ts` (new) — delete and promote run on the same transaction client; the
  oldest remaining account is the one promoted; no promotion happens when the deleted account was
  not primary.

## Acceptance criteria

- [x] Both flows run their writes on one transaction client.
- [x] Tests fail if the writes are moved back onto the global `prisma` singleton — each transaction
      test asserts both that the write hit `tx` **and** that the singleton was never touched. Without
      the second half the test would pass against the unfixed code.
- [x] 640 tests pass (up from 628), typecheck and lint clean.

## Result

12 new tests across two services that previously had none. `challengeProgressService` is now covered
for the completion path, the rollback path, the in-progress path and the level-up branch;
`accountService.disconnectAccount` for ownership scoping, promotion, the last-account case and
rollback.
