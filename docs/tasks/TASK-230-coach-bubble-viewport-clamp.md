# TASK-230 — Coach bubble must stay inside the viewport

## Status: In Progress

## Problem

On the guided tour, the coach bubble can render off-screen. Repro (14.png): the `leaderboard-inside`
step spotlights `leaderboard-preview` near the top of the page; `bubbleStyle`
(`CoachBubble.tsx`) uses `placement:"top"` → `top: rect.top - GAP` with `translate(-50%,-100%)`, so
the bubble is drawn above the viewport and its text is clipped. Only the X axis is clamped
(`clampX`); there is no vertical clamp and no flip.

## Fix

Position the bubble from its **measured** size and clamp it fully into the viewport:

- `ref` on the bubble; compute position in `useLayoutEffect` (deps: rect, placement, step id) and
  re-run on a `ResizeObserver` (the typewriter grows the bubble).
- Place beside the rect per placement (no CSS translate), then clamp `left ∈ [12, vw-w-12]`,
  `top ∈ [12, vh-h-12]`; for `top`/`bottom` flip to the other side when the preferred side would
  clip. Centered steps stay centered.

## Deliverables

- `src/domains/onboarding/guide/CoachBubble.tsx`: measured clamp/flip positioning.

## Verification

Playwright: on `leaderboard-inside` the bubble's bounding rect is fully within the viewport (top not
clipped). tsc + lint.
