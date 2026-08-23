# TASK-154: Team Mode — Separate route group and sidebar for team management

## Status: In Progress

## Goal

Separate the individual player experience from the team management experience inside the app.
After login, navigating to a team puts the user in "Team Mode" — a distinct route group with its
own sidebar, branding, and navigation — making it clear they are managing a team, not playing solo.

## Scope

- New `app/(team)/` route group with its own `TeamShell` + `TeamSidebar`
- `TeamSidebar` uses blue accent to signal team mode, has a "← Oyuncu Modu" back link
- Move `app/(app)/teams/[teamId]/` and `app/(app)/teams/[teamId]/members/` into the new group
- New `src/hooks/useTeams.ts` hook (replaces inline `useQuery` in team pages)
- Add `/teams` link to main player sidebar
- Update `app/(app)/teams/PageClient.tsx` to use `useTeams` hook

## Out of Scope

- New team features (analytics, training, etc.) — future tasks
- Changing team API routes
