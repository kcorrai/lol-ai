# TASK-239 — Dashboard "This Patch" meta-recommendation widget

## Goal
Turn the free tools' patch data into personal advice on the dashboard: cross-reference the
user's champion pool against the current tier lists and tell them which champions to keep, which
to fix, and which to drop — deep-linking into the (now in-app) tools.

## Change
- `src/domains/champions/index.ts` (new) — public API exposing `getChampionPool` so other
  domains import through the interface, not the service file.
- `src/domains/analysis/services/metaRecommendationService.ts` (new):
  - `getMetaRecommendations(riotAccountId)` — fetches the pool + the 5 role tier lists.
  - `buildRecommendations(pool, tierLists)` — pure, unit-tested. Combines the champion's meta
    tier with the user's own win rate:
    - `keep` — meta-strong (S/A) and the user isn't losing on it.
    - `improve` — meta-strong but the user is < 45% over ≥ 5 games ("the pick is fine, the
      matchups aren't" → counter picker). Avoids telling someone to spam a champ they lose on.
    - `switch` — weak (C/D) or slipped ≥ 5 ranks vs last patch, with a strong same-lane
      alternative they don't already play.
- `app/api/recommendations/champion-meta/route.ts` (new) — thin `withAuth` handler mirroring
  `app/api/champions/route.ts` (rate limit → validate → `assertOwnsRiotAccount` → delegate).
- `src/hooks/useChampionMetaRecommendations.ts` (new) — React Query hook.
- `src/components/dashboard/MetaRecommendationsWidget.tsx` (new) — icon + tier badge + message +
  tool deep-link; loading skeleton + empty state.
- Wired into `app/(app)/dashboard/PageClient.tsx` as a "This Patch" block above Patch Impact.
- `docs/API_DESIGN.md` — documents the endpoint.

## Tests
`metaRecommendationService.test.ts` — keep / improve / switch / dropped / ordering+limit / empty
pool / missing tier data. (No route-handler test: the repo has no route-test harness and the
handler is boilerplate; the risk lives in the pure builder, which is covered.)

refs TASK-239
