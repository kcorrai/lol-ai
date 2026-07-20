# TASK-245 — Daily momentum chart

## Goal
Show day-by-day progress on the dashboard — previously the only trend views were per-match — and
compare it against the duo picked in TASK-244.

## Change
- `src/domains/analysis/services/dailyMomentum.ts` (new) — pure:
  - `buildDailySeries(rows)` collapses matches into one point per day.
  - `mergeSeries(self, duo, metric)` aligns both players onto a shared date axis.
- `src/domains/analysis/services/dailyMomentumService.ts` (new) — `getDailyMomentum(riotAccountId,
  days)`. Window clamped to 90 days. Prisma returns `csPerMinute` as a Decimal, so rows are
  normalised before hitting the pure layer.
- `app/api/analysis/daily-momentum/route.ts`, `src/hooks/useDailyMomentum.ts`.
- `src/components/dashboard/DailyMomentumChart.tsx` — recharts line chart with KDA / CS-min /
  Vision / Win-rate tabs (user chose switchable metrics). Duo renders as a dashed second line.
  Wired into the dashboard right column under the last-game insight.
- `docs/API_DESIGN.md`.

## Two decisions worth recording
**Days off are gaps, not zeros.** A day with no games is omitted from the series and rendered as
`null`, with `connectNulls` bridging it. Emitting 0 would draw a cliff to the floor and read as a
catastrophic day rather than a rest day.

**KDA comes from daily totals, not the mean of per-game ratios.** One 10/0/10 game produces a
per-game KDA of 20, which would swamp the average and show a day that never happened.
`(ΣK + ΣA) / max(ΣD, 1)` is what the number should mean.

## Scope of the duo line
The duo's series covers only the matches the two shared — those are the only games we hold
participant rows for. So it reads as "how we're doing together", not as the partner's separate
career. Verified live that the two lines genuinely differ (same days: self KDA 1.89 / CS 3.8 vs
duo 2.05 / 5.1), i.e. it is the partner's own stats and not a copy of the player's.

## Tests
`dailyMomentum.test.ts` — one point per day in order, days off omitted, KDA from totals,
deathless day doesn't divide by zero, cs/vision averaging, win rate, empty input; plus
`mergeSeries` axis union, null (not zero) for a missing day, metric selection, no-duo case.

## Verified live
dev account on port 3002: duo C0marKopter#TR1 detected from real matches (39 games together,
54%), chart renders both lines across Jul 9-19 with all four metric tabs.

refs TASK-245
