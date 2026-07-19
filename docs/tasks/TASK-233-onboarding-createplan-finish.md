# TASK-233 — Onboarding: make the user create a plan + finish lands on dashboard

## Status: In Progress

## Problem

The improvement stop only showed a sample preview; the user should actually press "Create My Plan".
And after the final "Start climbing" the tour just ends in place — it should drop the user on the
dashboard.

## Fix

- Anchor `data-tour="create-plan"` on the "Create My Plan" button
  (`ImprovementPlanWidget.tsx`, the no-plan card).
- New guide gate `hasPlan`: `GuideGates` += `hasPlan`; `useGuidedOnboarding` reads
  `useImprovementPlan(primaryId)` → `hasPlan = !!plan`.
- Guide step `create-plan` after `go-improvement` (target `create-plan`, advance
  `{ type:"state", gate:"hasPlan" }`), so the tour waits for the user to actually create the plan;
  `improvement-inside` (sample history) stays after it.
- `useGuidedOnboarding.manualAdvance`: on `step.isFinal`, `router.push('/dashboard')` after
  completing onboarding.

## Deliverables

- `ImprovementPlanWidget.tsx` (anchor), `guideSteps.ts` (gate type + step),
  `useGuidedOnboarding.ts` (hasPlan gate + finish redirect), `guideSteps.test.ts`.

## Verification

Playwright: create-plan step spotlights the button; creating a plan advances via hasPlan; "Start
climbing" navigates to /dashboard.
