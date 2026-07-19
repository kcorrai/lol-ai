# TASK-221 — Onboarding: tilt modal blocks match click + hands-off auto-sync

## Status: In Progress

## Problem

Two issues hit while walking the forced first-journey (TASK-217) with a real account:

1. **Tilt modal blocks the "Open a match" step.** `TiltBreakModal` is a `fixed inset-0 z-50`
   full-screen modal shown whenever `tilt.level === "tilting"`. During onboarding its dark
   backdrop sits over the match row the tour asks the user to click — below the z-80 spotlight but
   above the row — so the spotlight "hole" lands on the tilt backdrop and the click never reaches
   the match. The user is frozen on the step.

2. **Sync should be hands-off.** Connecting an account already auto-syncs
   (`accountService.connectAccount` → `backgroundRefresh(syncAccount)`), but match data then only
   refreshes when the user manually presses "Sync Now". The user wants data to stay current on its
   own. Decision (product owner): keep the manual "Sync Now" button, and additionally auto-refresh
   a stale account silently when the dashboard loads.

## Fix

1. Suppress `TiltBreakModal` while the guided journey is active — gate on `useOnboardingPreview()`
   `previewActive` (the modal already lives inside the `OnboardingPreviewProvider`).
2. `useAutoSync(riotAccountId, lastSyncedAt)` — on the dashboard, silently fire a sync when the
   primary account's last sync is stale (> 30 min) and none is already running. Reuses
   `useSyncAccount` + `useSyncStatus` (the latter already invalidates data queries on completion).
   Pure decision extracted as `shouldAutoSync(lastSyncedAt, status, now)` for unit testing.

## Deliverables

- `TiltBreakModal.tsx`: `previewActive` guard.
- `src/hooks/useAutoSync.ts`: hook + `shouldAutoSync` helper + `useAutoSync.test.ts`.
- `dashboard/PageClient.tsx`: call `useAutoSync(primaryId, primaryAccount?.lastSyncedAt)` before
  the early return.

## Verification

Onboarding no-longer blocked by the tilt modal (Playwright, tilting account). Dashboard with a
stale `lastSyncedAt` fires one background sync on load; "Sync Now" still works. Unit tests for
`shouldAutoSync`.
