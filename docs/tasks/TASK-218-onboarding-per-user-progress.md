# TASK-218 — Onboarding step progress must be per-user, not per-browser

## Status: In Progress

## Problem

The forced first-journey engine (TASK-217) stores the active step index in a single
browser-global `localStorage` key (`lolai_first_journey_v1`). The completion **gate** is
correctly DB-backed (`Profile.onboardingCompletedAt`, mounts the overlay via
`AppShell`), but the **step index** leaks across accounts on the same browser:

1. User A finishes the journey → `manualAdvance` writes the final index (`11`) to the shared key.
2. User B registers fresh (server flag null → overlay mounts) but `readStoredIndex()` reads
   User A's `11` → User B is dropped straight onto the "You're all set 🎉" final step and
   skips the entire onboarding.

Repro: complete onboarding once, register a new account in the same browser, log in.

## Goal

Step progress is isolated per user so a fresh account always starts at step 0, while the
DB completion flag remains the single source of truth for _whether_ onboarding runs.

## Decision

- Keep step position client-side (per TASK-217 decision) but **namespace the storage key by
  user id**: `lolai_first_journey_v1:<userId>`.
- Thread the authenticated `userId` from the SSR layout (`session.user.id`, already fetched)
  → `AppShell` → `GuidedOnboarding` → `useGuidedOnboarding`. No new client session fetch.
- Extract a pure `storageKeyFor(userId)` helper so the keying is unit-testable.

## Deliverables

- `guideSteps.ts`: `storageKeyFor(userId)` helper.
- `useGuidedOnboarding(userId)`: read/write the per-user key.
- `GuidedOnboarding`, `AppShell`, `(app)/layout.tsx`: thread `userId` prop.
- Unit test for `storageKeyFor`.

## Out of scope

- Persisting step index to the DB (completion flag already covers the real gate).
- Enrichment of the step content (TASK-219).
