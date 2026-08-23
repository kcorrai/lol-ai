# TASK-247 — Counter results as win-rate bars

## Problem

15.png: the counter columns were plain rows, and the right-hand column reported **Sylas's** win
rate (61.2%, green) rather than the win rate of the champion you would be picking. The two columns
answered different questions, and the fact that those picks _lose_ was buried under a green number.

## Change

`src/domains/meta/components/CounterResults.tsx` (shared by `/tools/counter-picker` and
`/counters/[champion]`, so one edit covers both):

- Right column is now **"Worst picks against {name}"** and reports `opponentWinRate` — Malphite
  reads 38.8% in red instead of 61.2% in green. Both columns now answer one question: _if I pick
  this into {name}, how often do I win?_
- Each row gained a horizontal bar behind the champion, green on the left and red on the right.
- No service change: `counterService` already computes `opponentWinRate = 100 - subjectWinRate` and
  already orders `weakAgainstSubject` worst-first.

## Why the bar measures distance from 50%, not the win rate

Scaling the bar by raw win rate looked right on the left but was backwards on the right: the worst
matchup (38.8%) got the _shortest_ bar and the list appeared to grow as it got safer. Bars are
drawn from `matchupEdge(rate) = |rate - 50|` instead, so in both columns a long bar means a strong
signal — the hardest counter and the worst pick are both the longest row.

`counterBar.ts` also scales across each column's own range rather than 0-100: matchup win rates
cluster within a few points, so an absolute scale drew every bar at nearly the same width.

## Tests

`counterBar.test.ts` — top/bottom of range, a narrow range still spreading across the full width,
identical values not dividing by zero, single row, empty list, out-of-range clamping, and
`matchupEdge` giving the worst matchup a larger edge than a mild one.

## Verified live

`/counters/Sylas` — "Best picks against Sylas" (Riven 56.2%, green, full bar) and "Worst picks
against Sylas" (Malphite 38.8%, red, full bar; Orianna 45.6%, red, short bar).

refs TASK-247
