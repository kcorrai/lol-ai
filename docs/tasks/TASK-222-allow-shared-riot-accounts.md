# TASK-222 — Allow a Riot account to be linked by multiple users

## Status: In Progress

## Problem

`connectAccount` blocks a free-plan user from connecting a Riot account that another user has
already connected ("This Riot account is already connected to another user."). Real-world break:
a fan connects an esports player's account → the player themselves can no longer connect it. There
should be no such limit — one Riot ID may be linked by many app users (e.g. a player and their
fans/analysts all coaching off the same public match history).

## Decision (product owner)

Remove the cross-user uniqueness restriction entirely (for all plans). Keep the per-user guard so a
single user still can't link the same account twice (`@@unique([userId, puuid])` + the
"already connected to your profile" check).

## Fix

- `accountService.connectAccount`: delete the `!isPro` "otherExisting" block.
- Drop the now-unused `checkIsPro` import in that file (still used elsewhere — otp, cartAbandonment).

## Side effects (checked, safe)

- `profileSlug` is unique; two users on the same Riot ID would collide when setting the public
  slug — but `ensureProfileSlug(...)` is already called with `.catch(() => undefined)` in
  `connectAccount`, so the second user simply doesn't claim the public slug. No crash.
- No tests assert the removed behavior (no `accountService.test.ts`).

## Verification

Connect the same real Riot ID on two separate accounts — both succeed. Drive via the connect API.
