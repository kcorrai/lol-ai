# TASK-211: Animated "See it in action" product demo on the landing page

## Status: Done

## Goal

Show how the site is used via a video-like, auto-playing animated walkthrough on
the landing page (chosen over Remotion: framer-motion is already a dependency,
~40KB vs ~240KB, no CSP/eval risk). Complements the existing textual
`HowItWorksSection`.

## Scope

- `ProductDemoSteps.tsx`: four compact mock frames — Enter Riot ID, AI scans
  matches, coaching report (reuses `ReportPreview`), LP climb chart.
- `ProductDemo.tsx` (client): a framed "screen" that auto-advances through the four
  steps on a loop with `AnimatePresence` transitions; clickable step tabs; respects
  `useReducedMotion` (no auto-advance, manual tabs only).
- `app/(marketing)/page.tsx`: render `<ProductDemo />` after `HowItWorksSection`.

## Tests

tsc + lint + vitest green; dev-server visual check of the animated section.

## Commit

`feat(landing): animated "see it in action" product demo (framer-motion)`
