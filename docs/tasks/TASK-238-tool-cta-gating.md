# TASK-238 — Hide marketing-only CTAs from signed-in tool visitors

## Problem
Now that Free Tools render inside the app shell for signed-in users (TASK-237), the pages still
show marketing pitches meant for anonymous visitors: the "Free Tool · No login required" eyebrow
and the `/register` "Get your free AI analysis" CTA card. These are noise for a logged-in user.

## Change
- New server component `src/components/tools/PublicOnly.tsx` — renders its children only for
  anonymous visitors (returns `null` when a session exists). Its gate is a pure, JSX-free helper
  `src/components/tools/publicVisitor.ts` (`isPublicVisitor`) so the logic is unit-testable
  without rendering.
- Wrap the eyebrow + register CTA blocks with `<PublicOnly>` in the primary tools:
  `tools/counter-picker`, `tools/matchup`, `tools/draft-analyzer`, `tools/tier-list`, and the
  `tools` hub. The "Go Pro" upgrade nudges stay (they're relevant to signed-in free users).

## Follow-up
- `builds` / `aram` / `meta` pages can adopt the same `<PublicOnly>` wrapper.

## Test
`src/components/tools/publicVisitor.test.ts` — null / user-less / signed-in sessions.

refs TASK-238
