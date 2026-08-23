# TASK-210: Remove the 3D hero, replace with a static showcase

## Status: Done

## Goal

The WebGL/3D hero looked poor and shipped a heavy `three` + R3F + drei bundle.
Remove it and replace with a clean static visual.

## Scope

- Deleted `app/(marketing)/components/hero3d/` (HeroVisual, HeroCanvas,
  HextechParticles, SplashCards).
- New `HeroShowcase.tsx`: champion splash + a floating "AI Coach Insight" card
  (server component, no client JS).
- `HeroSection.tsx`: use `HeroShowcase` instead of `HeroVisual`.
- Uninstalled `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`
  (used only by hero3d). Updated DEPENDENCIES.md (ADR-009 superseded).

## Tests

tsc + lint + 352 tests green. Verified the new hero renders cleanly (dev + screenshot).

## Commit

`refactor(landing): drop 3D hero for a static showcase, remove three deps`
