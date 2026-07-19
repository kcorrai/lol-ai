# TASK-226 — Dev-only "Restart onboarding" button on the dashboard

## Status: In Progress

## Problem

Testing the forced first-journey repeatedly means registering a new account each time (completing it
sets the DB flag, and localStorage keeps the step index). We want a quick local shortcut to replay
the tour on the same account.

## Fix

A dev-only button on the dashboard that resets the current user's onboarding and restarts the
journey. Must not exist/function in production ("localde duracak").

- `POST /api/onboarding/reset` — `withAuth`, **guarded to non-production** (`NODE_ENV`), sets the
  current user's `Profile.onboardingCompletedAt = null` via `resetOnboarding(userId)`.
- `DevRestartOnboarding` (client) — renders only when `NODE_ENV !== "production"`; on click: POST
  reset → clear the per-user localStorage journey key (`storageKeyFor(user.id)`, TASK-218) → reload
  `/dashboard` so the SSR gate re-mounts the overlay from step 0.
- Rendered in `dashboard/PageClient.tsx`.

## Deliverables

- `onboardingService.resetOnboarding`.
- `app/api/onboarding/reset/route.ts` (dev-guarded).
- `src/components/dashboard/DevRestartOnboarding.tsx`.
- Wire into `app/(app)/dashboard/PageClient.tsx`.

## Verification

Dev: button visible on dashboard → click → tour restarts from "Welcome". Prod build: button not
rendered and the endpoint 404s.
