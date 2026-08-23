# ADR-010: Forced Cross-Page Guided Onboarding

## Status: Accepted

## Context

New users landing in the app were bounced to a standalone full-screen wizard (`/onboarding`) that
connected an account but taught nothing about the real product, and a separate dashboard-only
"coach tour" was purely presentational (blocked clicks, advanced via a Next button, never crossed
pages). Neither made the user actually learn or use the app, and there was no enforcement that a
user completed onboarding before using the product.

We wanted a single, forced, Clash-Royale-style guided journey: the user is driven step-by-step
through the _real_ application (connect an account on the real Accounts page, open a real match,
generate a real AI report, visit Improvement/Badges/Leaderboard), with only the relevant element
lit and interactive while everything else is dimmed and click-blocked. The user cannot use the site
until the journey is complete.

## Decision

- **Gate is DB-backed but minimal.** A single nullable `Profile.onboardingCompletedAt` is the only
  persisted state and the sole source of truth for "onboarding done". It is bypass-proof: only the
  final step's `POST /api/onboarding/complete` sets it. The (app) layout SSRs this flag so the
  overlay is present on first paint (no flash of a usable app).
- **Step position is client-side (localStorage), not DB.** The engine auto-fast-forwards past any
  step whose real-world precondition is already satisfied (account connected, matches synced, report
  complete), derived live from existing React Query hooks. This keeps the migration to one column,
  resumes across reloads, and behaves sanely on a second device (real gates re-satisfy themselves).
- **Action-driven advancement.** Each step advances only by doing the real thing: `route-reached`,
  `target-clicked`, a live `state` gate, or a `manual` "Got it". No skip button (the flow is forced).
- **Click-through spotlight.** Unlike the retired overlay, four dim panels tile the viewport around
  the target rect and absorb clicks, leaving the target itself uncovered so the real element stays
  interactive. Nav route steps also expose a "Take me there" fallback so off-screen/mobile nav never
  hard-locks.
- **Retire the old flows.** The standalone `/onboarding` wizard redirects to `/dashboard`; the old
  dashboard `CoachTour` and its `OnboardingFlow`/`useOnboardingFlow` cluster are deleted.

## Consequences

- **Positive:** One coherent, enforced onboarding that doubles as a product tour; robust completion
  gate; tiny schema footprint; reuses the real connect/sync/report flows (no duplicate UI).
- **Negative / trade-offs:** The overlay lives in the app shell and runs a few extra queries while a
  user is un-onboarded (mitigated by only mounting it when `onboardingCompletedAt` is null). Step
  position in localStorage means clearing storage restarts the _tour_ (not completion). Mobile nav
  choreography leans on the "Take me there" fallback for sections absent from the BottomNav.
- **Follow-ups:** replay-tour button for finished users; per-step PostHog analytics; richer mobile
  choreography.
