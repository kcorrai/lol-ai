# TASK-236 — Group the sidebar into sections + add Free Tools

## Problem
The in-app sidebar (`src/components/layout/Sidebar.tsx`) lists 12 items in a single flat
"Play" section — visually crowded and hard to scan. The 7 public Free Tools are not reachable
from inside the app at all.

## Change
- Replace the flat `NAV_MAIN` with a `NAV_SECTIONS` structure grouping the Play items:
  - **Overview**: Dashboard
  - **Coaching**: Reports, Coach Chat, Improvement, OTP Assistant
  - **My Performance**: Champions, Heat Map, Season Recap, Milestone
  - **Compete**: Leaderboard, Badges, Teams
  - **Free Tools** (new): Counter Picker, Matchup Analyzer, Draft Analyzer, Tier List,
    Champion Builds, ARAM Tier List, Patch Meta
- Preserve every existing `data-tour` id (the guided onboarding tour targets them).
- Keep `NAV_SETTINGS` unchanged. Fix `NavItem`'s active-route detection to flatten the new
  structure.

## Out of scope
- `BottomNav.tsx` (mobile) — separate follow-up.
- The tools still render in marketing chrome until TASK-237 makes the layout auth-aware.

## Test
`src/components/layout/navConfig.test.ts` — nav config invariants (unique hrefs, all legacy
`nav-*` tour ids present, Free Tools hrefs included).

refs TASK-236
