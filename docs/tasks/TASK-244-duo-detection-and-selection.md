# TASK-244 — Duo detection and selection

## Goal
Let a player see who they actually queue with, and mark one of them as their duo — the anchor for
the daily momentum comparison in TASK-245.

## Key insight
No new match data was needed. `matchParticipant` already stores all ten players of every synced
match with `puuid`, `teamId`, `gameName` and `tagLine`, so "how often did we play together" is a
query, not a feature that needs collecting. The one thing worth being careful about: the same
table holds opponents, so a rival met ten times looks identical to a duo unless team ids are
compared per match — and the player isn't always on the same side.

## Change
- **Schema** (`DuoPartner`, migration `20260720000001_add_duo_partner`) — user-approved. Keyed by
  `(riotAccountId, puuid)`; `gameName`/`tagLine` denormalised so a partner still renders after a
  Riot ID change or once they drop out of the match window. Deselected rows are kept with
  `isActive=false` rather than deleted, so switching back doesn't lose history.
- `src/domains/analysis/services/duoRanking.ts` (new) — pure `rankTeammates(ownRows,
  teammateRows)`. Same match **and** same team, resolving the player's team per match; ranks by
  games then win rate; drops anyone under 3 shared games; takes the display name from the most
  recent game.
- `src/domains/analysis/services/duoService.ts` (new) — `getDuoCandidates`, `getActiveDuo`,
  `setDuo`, `clearDuo`, `findTeammateByRiotId`. All go through one `scanTeammates` helper: two
  queries regardless of match count, never one per match. A duo the player picked explicitly is
  honoured below the 3-game threshold; auto-detection keeps it.
- `src/domains/riot/index.ts` — exports `getAccountPuuid` so the new service reaches it through
  the domain's public API.
- `app/api/duo/route.ts` (GET/POST/DELETE) + `app/api/duo/candidates/route.ts`.
- `src/hooks/useDuo.ts` — `useDuo`, `useDuoCandidates`, `useSetDuo`, `useClearDuo`.
- `src/components/dashboard/DuoWidget.tsx` + `DuoPicker.tsx` — pick from detected candidates or
  type a Riot ID. Wired into the dashboard left column as a "Duo" block.
- `docs/API_DESIGN.md`, `docs/DATABASE_SCHEMA.md`.

## A deliberate limit
A typed Riot ID is resolved against the player's **own match history**, not the Riot API. That
isn't a shortcut: the duo view is built from stored participant rows, so a player who has never
shared a match with the caller has no data to show. Rejecting the name is more honest than
accepting it and rendering an empty chart. It also keeps this feature off the rate-limited dev
Riot key.

## Tests
`duoRanking.test.ts` — opponents excluded, per-match team resolution, threshold, shared win rate,
most-recent name wins, ranking order and tie-break, empty history, limit.
No route-handler tests: the repo has no route-test harness, and the risk lives in the pure ranker.

refs TASK-244
