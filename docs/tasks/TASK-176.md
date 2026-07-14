# TASK-176: 3D Stack + Hextech Hero (Splash-Art Cards)

## Status: Pending
## Score: 85/100

## Goal
React Three Fiber hero: golden hextech particle field + 3-5 floating cards
textured with real champion splash art (DDragon/CDragon), mouse parallax.
Lazy-loaded so LCP stays < 3s.

## Scope
- Dependencies (React 18 compatible — R3F v9 requires React 19, do NOT use):
  `three`, `@react-three/fiber@^8`, `@react-three/drei@^9`, `framer-motion@^11`
  → record in `docs/DEPENDENCIES.md` + ADR "3D landing stack"
- `app/(marketing)/components/hero3d/` (each file < 200 lines):
  - `HeroScene.tsx` — Canvas setup, dpr clamp, visibility-based frameloop
  - `SplashCards.tsx` — floating cards with real splash textures (use DDragon
    loading-screen images ~130KB, not full splash), mouse parallax tilt
  - `HextechParticles.tsx` — gold particle points + energy lines
- Integration: `next/dynamic` ssr:false, static poster fallback (the LCP element),
  `prefers-reduced-motion` → static poster, lightweight mobile variant

## Out of Scope
- 3D on other pages; GLTF champion models (Riot IP + weight)

## Commit
`feat(landing): 3d hextech hero with real splash art`
