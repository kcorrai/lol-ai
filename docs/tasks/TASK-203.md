# TASK-203: Finish English i18n + fix win-rate format on public/app surfaces

## Status: Done

## Goal
The app was migrated to English but left Turkish-format leftovers that read wrong
in an English UI, on public/shareable/SEO surfaces too:
- Win rate rendered as `%45` (Turkish convention) instead of `45%` — ~21 spots
  (leaderboard, milestone, teams, recap, public profile `/u/[slug]`, `/s/...`
  stats, OG image routes, landing demo preview, admin).
- Billing shows `/ ay` instead of `/ month`.
- Improvement page links to `/settings/subscription` (dead) — billing is `/settings/billing`.
- Turkish strings: weekly card "Bu Hafta", improvement-plan weekLabel "2'den 1./2. Hafta".

## Scope
- Move the `%` to the end for every win-rate display: `%{x}` → `{x}%`,
  `` `%${x}` `` → `` `${x}%` `` (verified these patterns are win-rate-only across the repo;
  legitimate `unit="%"`, `suffix:"%"`, `100%` are untouched).
- `settings/billing/PageClient.tsx`: `/ ay` → `/ month` (x2).
- `improvement/PageClient.tsx`: `/settings/subscription` → `/settings/billing`.
- `weeklyCardOg.tsx`: "Bu Hafta" → "This Week".
- `improvementPlanCompute.ts`: weekLabel → "Week 1 of 2" / "Week 2 of 2".

Excluded (verified NOT a bug): free users can't disconnect their single account —
intentional anti-scraping gate in `authorization.ts`.

## Tests
tsc + lint + vitest green. Spot-checked strings.

## Commit
`fix(i18n): render win rate as NN% and finish English string cleanup`
