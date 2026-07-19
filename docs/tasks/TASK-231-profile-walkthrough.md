# TASK-231 — Onboarding walks the whole profile, not just the hero

## Status: In Progress

## Problem

On the guided first-journey, landing on the user's public profile only spotlights the hero
(`profile-intro` → `profile-hero`) and moves on — "sadece bir yer gösterip bırakıyorsun". The user
wants the profile shown in full: rank/hero, season stats, champion pool, badges.

## Fix

- Anchors on `app/u/[slug]/page.tsx`: `profile-stats` (stats grid), `profile-champions`
  (champion pool), `profile-badges` (badges block). `profile-hero` already existed.
- Replace the single step with a walkthrough in `guideSteps.ts`: `profile-hero` → `profile-stats`
  → `profile-champions` → `profile-badges`, each a manual spotlight with its own copy, between
  `click-my-name` and `go-reports`.
- Conditional sections (stats/badges only render with data): add `skipIfMissing?: boolean` to
  `GuideStep`; `useGuidedOnboarding` auto-advances past a `skipIfMissing` step whose target isn't in
  the DOM after ~700ms, so a sparse profile skips absent sections instead of showing an empty
  spotlight. Depends on TASK-230 so the bubble never clips near section edges.

## Deliverables

- `guideSteps.ts` (type + 4 profile steps), `useGuidedOnboarding.ts` (skip-if-missing),
  `app/u/[slug]/page.tsx` (3 anchors), `guideSteps.test.ts`.

## Verification

Playwright (dev@lolai.test, `/u/DevPlayer-TEST` has stats + champions): step through
hero → stats → champions → badges; each spotlights its section; a profile with no badges skips the
badges step. tsc + tests.
