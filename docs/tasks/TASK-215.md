# TASK-215: Remotion product video (local render) on landing + onboarding

## Status: Done

Render verified: `npm run render:video` produces `public/videos/how-it-works.mp4`
(1280x720, 30fps, ~15s, ~1.1 MB) in this environment. Video is embedded on the
landing "See it in action" section and the dashboard onboarding welcome slide.
The framer-motion ProductDemo/ProductDemoSteps were removed (no dead code).

## Decision
User is an individual (Remotion license = free) and wants zero money cost →
LOCAL render only (no AWS/Lambda). Produce a real .mp4 with `npx remotion render`,
commit it under `public/videos/`, and embed via `<video>`.

## Plan
- Deps: `remotion` + `@remotion/cli` (exact versions). Update DEPENDENCIES.md.
- `remotion.config.ts` + `src/remotion/` project: `index.ts` (registerRoot),
  `Root.tsx` (Composition), and a `HowItWorks` composition (1280x720, 30fps, ~14s)
  animating: intro → enter Riot ID → AI scans matches (real champion icons via
  ddragon) → coaching report → LP climb. Dark theme, gold accent.
- npm script `render:video` → `public/videos/how-it-works.mp4`.
- **Gating step: verify the local render actually works in this environment**
  (Remotion downloads a headless Chromium + bundles ffmpeg). If it renders:
  - `DemoVideo.tsx`: autoplay/muted/loop/playsInline `<video>`.
  - Landing "See it in action": swap the framer-motion ProductDemo for the video;
    remove the now-superseded ProductDemo/ProductDemoSteps (no dead code).
  - Onboarding: show the video on the welcome slide.
  - If render FAILS after reasonable effort: keep the framer-motion demo, commit
    the Remotion source + render script for later, and report the blocker.

## Tests
tsc + lint + vitest green. Video renders locally and plays in the browser.

## Commit
`feat(video): remotion how-it-works video, rendered locally, on landing + onboarding`
