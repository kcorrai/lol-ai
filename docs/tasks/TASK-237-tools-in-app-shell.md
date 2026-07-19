# TASK-237 — Make the tools layout auth-aware (port Free Tools into the app shell)

## Problem
The 7 public Free Tools live under `app/(tools)/` and render in the marketing chrome
(`MarketingHeader`/`MarketingFooter`). Now that the sidebar links to them (TASK-236), a
logged-in user clicking a tool is ejected from the app shell — no sidebar, marketing header.

## Change
- Convert `app/(tools)/layout.tsx` to an async server component that inspects the session
  (`getSession()` from `@/lib/auth/session`):
  - **Logged out** → current marketing chrome (unchanged; preserves SEO + public access).
  - **Logged in** → new `ToolsAppChrome` (app sidebar + top bar), so tools stay in-shell.
- New client component `src/components/layout/ToolsAppChrome.tsx` — a slim `AppShell`:
  `QueryProvider` + `Sidebar` + `TopBar` + `BottomNav` + `<main>`, reusing `useUIStore` for
  the collapse state. Deliberately omits the forced-onboarding pieces (`GuidedOnboarding`,
  `OnboardingPreviewProvider`, `TiltAlertBanner`) — tool pages aren't part of the guided
  journey.

## Notes
- Same URLs for both audiences; no route duplication, SEO path intact.
- `SessionProvider` is at the root layout, so Sidebar/TopBar hooks resolve. Nested
  `QueryProvider` is safe with islands that already self-provide (e.g. `PersonalMatchupPanel`).
- Marketing-only CTAs inside the tool pages are hidden for signed-in users in TASK-238.

refs TASK-237
