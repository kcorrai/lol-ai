# TASK-216: Clash Royale-style dashboard onboarding + gamified progression quick-wins

## Status: Done (code); live visual pass pending a test DB

Verified: `tsc` clean, `next lint` clean, `vitest` 352/352 green. A durable authed e2e
(`tests/e2e/tour.spec.ts`, smoke project) asserts first-visit open → advance → Skip persists.
It could not be run in this local env (the `.env.local` DB is missing migrations —
`webhook_events` absent — and mutating the user's real DB to seed was declined); it will run in
CI against a proper `E2E_DATABASE_URL`. To eyeball locally: `npm run dev`, clear
`localStorage['lolai_coach_tour_v1']`, reload `/dashboard`.

## Problem
First-run dashboard guidance is a static 2-slide modal (`DashboardOnboarding.tsx`) that never
teaches the real UI. Progression (level/XP/streak) is buried low in the left column and
`XpLevelWidget` still has leftover Turkish text and hides the `streak` the API already returns.

## Decision (confirmed with user)
- **Spotlight guided tour** (Clash Royale style): dim the screen, cut a hole around one real
  element at a time, a **coach mascot** walks the player through with speech bubbles + pointer +
  confetti/XP finale.
- **Icon/CSS coach mascot** (no image asset — none in `public/`).
- **Dashboard quick-wins only**: fix XP widget (English + streak) + a visible progression strip.

## Plan
### Part A — tour (`src/components/onboarding/tour/`)
- `tourSteps.ts` — declarative steps: welcome → progression → ask-coach → nav-reports →
  daily-tasks → nav-badges → finish (confetti + CTA → /coaching).
- `CoachTour.tsx` — orchestrator; first-run gate `localStorage['lolai_coach_tour_v1']`; resolves
  `[data-tour="..."]`, scrolls into view, tracks rect on scroll/resize; Back/Next/Skip/Esc.
- `SpotlightOverlay.tsx` — dimmer + box-shadow cutout + glow ring + animated pointer.
- `CoachMascot.tsx` — gold Bot/Sparkles avatar, idle bounce/blink, typewriter speech bubble,
  progress dots + controls.
- `Confetti.tsx` — extracted from `DashboardOnboarding`, reused for the finale.
- Wire `data-tour` attrs into PageClient / Sidebar / BottomNav; retire `DashboardOnboarding.tsx`.
- `tailwind.config.ts` — add `coach-bounce`, `blink`, `nudge` keyframes.

### Part B — dashboard quick-wins
- `XpLevelWidget.tsx` — English + 🔥 streak.
- `ProgressionStrip.tsx` — top-of-dashboard player card (level + XP bar + streak + summoner level +
  Pro/Free) from `useChallenges()`; forwards `data-tour="progression"`.

## Tests
tsc + lint + vitest green (352 baseline). Manual: clear the localStorage flag, reload /dashboard,
tour runs target-to-target, Skip/Esc exits, reload does not re-open. Mobile fallback to BottomNav.

## Commit
`feat(onboarding): clash-royale-style spotlight coach tour + gamified progression strip`
