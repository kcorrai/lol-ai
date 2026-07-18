# TASK-214: First-visit guided onboarding on the dashboard

## Status: Done

## Goal
When a user first lands on the dashboard, guide them like a game intro — an
animated welcome that gets them to try features (not the existing Riot-connect
/onboarding flow, which is separate).

## Scope
- `src/components/dashboard/DashboardOnboarding.tsx` (client): a first-visit
  overlay (persisted in localStorage `lolai_onboarding_v1`, shown once). Animated
  accent header + two intro slides (framer-motion AnimatePresence) → a guided
  action list (Get first report, Ask coach, Champion pool, Free tools) that
  navigates on click. Progress dots + Next / dismiss. SSR-safe (renders null
  until the localStorage check runs); no schema change.
- Mounted at the top of `app/(app)/dashboard/PageClient.tsx` (self-gating; minimal
  insertion).

## Tests
tsc + lint + 352 tests green. (Behind auth — logic verified statically; visual on
the deploy with a real session.)

## Commit
`feat(onboarding): first-visit guided dashboard welcome`
