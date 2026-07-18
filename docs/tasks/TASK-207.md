# TASK-207: Logged-in free-user upgrade nudge on free tools

## Status: Done

## Context (verified)
- Public `(tools)` pages have SessionProvider (root) but NOT QueryProvider (that's
  only in `(app)` layout). So `useAuth` works there; `useSubscription` (React Query)
  does not. Islands that need RQ supply their own `QueryProvider` (see
  `PersonalMatchupPanel`).
- counter-picker already upsells logged-in users via `PersonalMatchupPanel` — do
  NOT add a nudge there. The gap is matchup + draft-analyzer, which only have a
  logged-OUT `/register` CTA and nothing for logged-in free users.

## Scope
- `app/(tools)/ToolUpgradeNudge.tsx` (client island): uses `useAuth`; for
  authenticated users it fetches `/api/subscription` via plain `apiFetch` (no RQ
  dependency) and renders an upgrade card ONLY for free users (hidden for
  logged-out and Pro/Elite/Team). Links to `/settings/billing`.
- Add `<ToolUpgradeNudge>` after the results on the matchup and draft-analyzer
  pages, with tool-specific copy.

## Tests
tsc + lint + vitest green. Renders nothing for logged-out/Pro (no layout impact).

## Commit
`feat(growth): logged-in free-user upgrade nudge on matchup & draft tools`
