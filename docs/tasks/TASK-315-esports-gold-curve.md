# TASK-315 — Gold curve on match pages

**Phase:** 6 — Esports & Audience Growth
**Status:** Planned
**Estimated Effort:** 0.5 day
**Depends on:** TASK-303

---

## Objective

Add the team gold-difference curve to `/esports/matches/[matchId]`, the one piece
of TASK-303's scope left out because its cost belongs to a decision of its own.

## The cost being decided

The livestats window returns ten frames at ten-second spacing — 100 seconds of
game — per request. A 35-minute game is therefore ~21 requests at full
resolution, against an unofficial feed we are explicitly careful with (ADR-016).

Sampling every five minutes brings it to 7-9 requests per game. Completed games
cache for 30 days and TASK-305 warms them, so the cost is paid once per game, not
per reader — but it is still an order of magnitude more traffic than the two
requests a match page makes today.

## Scope

- `getGoldCurve(gameId, { completed })` in `gameStatsService`, sampling at a
  fixed interval and stopping at the first frame reporting `finished` — sampling
  past the end returns the final totals and would flatten the tail into a
  straight line.
- Cached as one array per game, 30 days for a completed game.
- A `GoldCurve` component: team gold difference over time, zero line, side
  colours matching the scoreboard.
- Only fetched for the game actually being viewed, never for every game in a
  series.

## Acceptance Criteria

- [ ] Curve renders for a completed game and matches the final gold difference
      at its right edge
- [ ] Request count per game is bounded and logged
- [ ] A game with partial coverage renders the samples it has, labelled
- [ ] No curve is fetched for games the reader is not looking at
- [ ] Component under 200 lines; `tsc --noEmit`, lint and tests pass
