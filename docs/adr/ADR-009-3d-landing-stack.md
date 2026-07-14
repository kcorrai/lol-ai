# ADR-009: 3D Landing Stack (React Three Fiber)

## Status: Accepted

## Context

The landing page hero was a static CSS dashboard mockup. To make the site feel
modern and distinctly League-branded, we want a 3D hero: floating real champion
splash-art cards in a golden hextech particle field with mouse parallax — without
regressing LCP or shipping a huge bundle to every visitor.

Options:
- **Raw Three.js** — full control but verbose imperative setup in React.
- **React Three Fiber (R3F) + drei** — declarative Three.js for React, huge
  ecosystem, `useTexture`/`Float` helpers cut boilerplate.
- **Spline / external 3D tool** — heavy, external hosting, less control, CSP risk.

Version constraint: the app is on **React 18**. R3F v9 requires React 19, so we
pin **@react-three/fiber@^8** and **@react-three/drei@^9** (the React 18 line).

## Decision

Use React Three Fiber v8 + drei v9 + three for the hero, and framer-motion for
lightweight UI animation elsewhere. The scene is isolated in
`app/(marketing)/components/hero3d/` and:

- Loads lazily via `next/dynamic({ ssr: false })` — WebGL never blocks first paint.
- A static champion splash poster is the LCP element and the fallback.
- Is skipped entirely for `prefers-reduced-motion` users and screens ≤ 768px
  (they get the poster only).
- Textures are the ~60KB Data Dragon *loading* portraits (not 4K splash), served
  with `Access-Control-Allow-Origin: *` so WebGL can use them; `img-src` already
  allows the Data Dragon host.

## Consequences

- **Positive:** distinctive, on-brand hero; real Riot art; parallax depth; bundle
  isolated to the marketing route and lazy-loaded.
- **Negative:** ~600KB of 3D libs added (marketing route only, code-split). Mitigated
  by lazy-load + reduced-motion/mobile opt-out.
- Pinned to the R3F v8 line until the app upgrades to React 19.
