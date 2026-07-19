# TASK-225 — Onboarding continues onto the public profile page

## Status: In Progress

## Problem

The forced first-journey (TASK-217) opens a match breakdown, then jumps to Reports. We want it to
first send the user to click their own name → their **public profile** (`/u/[slug]`) and keep the
tour running there before moving on. Today the guide vanishes on the profile: the overlay is mounted
only in the `(app)` shell (`AppShell`), while `app/u/[slug]/page.tsx` is a public, ISR server
component with its own nav and no `QueryProvider`.

## Fix

- Mount the guide on the profile page for an authenticated, not-yet-onboarded viewer only:
  `ProfileOnboarding` (client) = `QueryProvider` → gate on `useSession()` + `useOnboardingState()`
  → `<GuidedOnboarding userId=… />`. Logged-out visitors render nothing.
- Gate source of truth = server flag: `GET /api/onboarding/state` + `useOnboardingState`.
- Anchors: `data-tour="my-profile-link"` on the user's own name in `MatchTeamTable`;
  `data-tour="profile-hero"` wrapping `PublicProfileHero` on the profile page.
- Two new steps after `match-breakdown`, before `go-reports`: `click-my-name` (route `/u/`),
  `profile-intro` (manual, spotlights the hero). Returning to the app is handled by the existing
  `go-reports` `goTo:"/coaching"` + TASK-220 non-blocking/"Take me there" fallback.

## Deliverables

- New: `app/api/onboarding/state/route.ts`, `src/hooks/useOnboardingState.ts`,
  `src/domains/onboarding/guide/ProfileOnboarding.tsx`.
- Edit: `app/u/[slug]/page.tsx`, `MatchTeamTable.tsx`, `guideSteps.ts`, `guideSteps.test.ts`.

## Verification

Unit: guideSteps test (anchors + step order), tsc, lint. E2E: onboarding user opens a match →
clicks own name → profile page shows the coach bubble on the hero → continues to Reports. Guide
absent when logged out / already onboarded.
