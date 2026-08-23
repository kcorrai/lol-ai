# TASK-192: Remove dashboard tool links that eject users to marketing chrome

## Status: Done

## Goal

The in-app sidebar/bottom-nav linked to the public `/tools/*` routes, which render
under the `(tools)` marketing layout (MarketingHeader/Footer). A logged-in user
clicking them lost the app shell and landed on landing-page chrome.

## Scope

- `Sidebar.tsx`: remove the `NAV_TOOLS` section (Counter Picker, Matchup Analyzer,
  Draft Analyzer). Keep the in-app `/otp` (OTP Assistant) by moving it into
  `NAV_MAIN`. Drop now-unused icon imports and the `NAV_TOOLS` reference in
  `allHrefs`.
- `BottomNav.tsx`: replace `/counter` (308-redirects into marketing chrome) with
  the in-app `/champion-pool` (Champions), keeping the bar in-app and balanced.

## Tests

- Typecheck + lint clean. Manual: logged-in sidebar no longer shows the Tools
  section; no nav item ejects to marketing chrome.

## Commit

`fix(nav): drop dashboard tool links that ejected users to marketing chrome`
