# TASK-217 — Forced, Cross-Page "First Journey" Onboarding

## Status: In Progress

## Problem

A brand-new user (no Riot account) landing on `/dashboard` is bounced to a standalone
full-screen wizard (`app/(app)/onboarding/`) that teaches nothing about the real product.
A separate dashboard-only `CoachTour` is presentational, blocks all clicks, and never
crosses pages. Neither forces the user to actually learn the app.

## Goal

A single, forced, **cross-page** guided journey that drives a new user step-by-step through
the _real_ application, Clash-Royale style: only the element to interact with is lit; the rest
of the screen is dimmed and non-interactive. The user cannot use the site until the journey
is complete.

## Decisions (confirmed with product owner)

- **Gate = DB-backed** — single nullable `Profile.onboardingCompletedAt`. Completion is
  bypass-proof (only the final API call sets it). Step position is client-side (localStorage)
  and auto-fast-forwards past already-satisfied steps.
- **Connect on the real `/settings/accounts` page** (spotlight the real form). The old
  standalone `/onboarding` wizard is retired (redirects to `/dashboard`).
- **Hard actions** — the Reports stop forces a real first AI report generation.

## Step sequence

welcome → go to Accounts → connect account → syncing → go to Dashboard → click a match →
read breakdown → go to Reports → generate first report (real) → Improvement → Badges →
Leaderboard → finish (confetti + POST completion).

## Deliverables

- `Profile.onboardingCompletedAt` + migration.
- `src/domains/onboarding/guide/` engine (steps, click-through overlay, coach bubble, hook, orchestrator).
- `onboardingService` + `POST /api/onboarding/complete` + `useCompleteOnboarding`.
- `AppShell` + `(app)/layout` wiring (SSR initial state → no flash).
- `data-tour` anchors on nav items, connect form, first match row, generate-report section.
- Retire standalone wizard + old dashboard CoachTour.
- Unit tests (service + steps), e2e spec (CI), ADR-010, docs.

## Out of scope (follow-ups)

- Replay-tour button for already-onboarded users.
- Per-step PostHog analytics.
- Mobile-specific choreography beyond the BottomNav fallback.
