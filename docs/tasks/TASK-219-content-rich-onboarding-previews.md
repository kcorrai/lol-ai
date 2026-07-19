# TASK-219 — Content-rich onboarding: in-page preview mode for empty tabs

## Status: In Progress

## Problem

The forced first-journey (TASK-217) walks a new user *to* each tab (Leaderboard, Badges,
Improvement, …) but only shows a one-paragraph coach bubble and immediately advances on
route match. Because a brand-new user has no data, those tabs are empty — the user is told
"here is the Leaderboard" while staring at an empty page. The onboarding tells, but never
*shows*.

## Goal

When the guided journey lands on a tab that has no real data yet, the tab renders an
**animated preview** of what it will look like once populated — real UI components filled
with illustrative mock data, badged "Preview • örnek veri" so it is never mistaken for the
user's own stats. The coach bubble explains it alongside. Media is framer-motion
(already a dependency) — no Remotion, no binary video assets (see reverted TASK-215).

## Decisions (confirmed with product owner)

- **Media = in-app framer-motion animated previews** of the real components with mock data.
- **Placement = embedded in each page's own empty state** (not inside the 340px coach
  bubble). Preview mode is driven by a client context that is active only during the guided
  journey; the coach bubble narrates beside it.
- Preview data is clearly labelled and static (deterministic mock, no `Math.random`).

## Approach

- `OnboardingPreviewContext` (client): `previewActive` is true while the guided journey is
  active. Provided at `AppShell` level next to `GuidedOnboarding`.
- Shared `<PreviewBadge/>` + a small `useOnboardingPreview()` hook.
- Each targeted tab's empty state checks `previewActive`; if set, renders a framer-motion
  mock instead of the plain empty placeholder.
- Expand `GUIDE_STEPS`: each tab stop becomes a *manual* "look at the inside" step so the
  user actually sees the preview before advancing (instead of auto-advancing on route).

## Deliverables (incremental, one tab per commit after the framework)

- Framework: `OnboardingPreviewContext`, `useOnboardingPreview`, `PreviewBadge`.
- Per-tab framer-motion mocks + empty-state wiring: Leaderboard → Badges → Improvement →
  Milestone (further tabs as follow-ups).
- Updated `GUIDE_STEPS` (manual "inside" steps).
- Unit tests for the framework hook/context and mock data builders.

## Out of scope

- Re-introducing Remotion or any recorded video.
- Preview mode for tabs the journey does not visit.
- Replaying the preview for already-onboarded users.
