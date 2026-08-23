# TASK-312 — Duo synergy analytics

Builds on [TASK-244](./TASK-244-duo-detection-and-selection.md), which stored _which_ teammate is
the duo. This works out what that duo is worth. Feeds the panel in TASK-314.

## Goal

Answer the only question a duo panel exists to answer: **am I better with this person, or worse?**
Plus the supporting detail — which champion pairing works, which roles they actually queue, and
what has changed lately.

## What existed

`DuoWidget` showed a name, a game count and a win rate together. A win rate together means
nothing on its own: 51% together is good for a Silver player and a disaster for someone who wins
70% alone. The comparison was the missing half.

## Change

- `duoSynergy.ts` — pure. Together/apart records, the delta between them, current streak,
  champion pairings, role pairings, the player's own averages in each case, and the last five
  shared games. No Prisma, no dates from the clock.
- `duoSynergyService.ts` — two queries, never one per match, over the same 200-match window
  `duoService` uses.
- `GET /api/duo/synergy` and `useDuoSynergy`. Marking a new duo now invalidates the synergy and
  quest keys too, so the panel cannot keep describing the previous partner.

## Where the numbers refuse to appear

Below five shared games `hasEnoughData` is false. At four games one result moves the win rate 25
points, so a confident "+25 synergy" would be an artefact of a single game — the mistake TASK-295
found in `AnalysisDeltas` and fixed there. The figures are still computed; the flag is what tells
the panel not to print them.

`synergyDelta` is null when either side has no games, rather than 0. A pair who have never played
apart have no comparison, which is not the same as no difference.

## Two bugs found against real data, both older than this task

Running it over a real 105-match account did not add up: 73 together + 27 apart = 100.

1. **A PUUID reissue orphaned five matches.** Riot can hand an account a new PUUID. `duoService`
   scanned by `puuid` alone, so rows carrying the old one — still correctly linked by
   `riotAccountId` — were invisible to every duo figure. Both services now select with
   `ownParticipantWhere`, an `OR` over both columns. The delta moved from −19 to −18 once the
   missing games were counted, and the sum now equals the account's real match count.

2. **Fixing that introduced a worse one, caught the same way.** Excluding the player from the
   teammate scan with `NOT (riotAccountId = … OR puuid = …)` returned _no teammates at all_: the
   other nine participants have a null `riotAccountId`, and in SQL `NOT (NULL OR false)` is NULL,
   which filters the row out. The exclusion is now `puuid: { notIn: [...every PUUID the account
has used] }`. Without it the player would eventually have been ranked as their own duo partner.

## Tests

`duoSynergy.test.ts` — the together/apart split, a partner on the enemy team not counting as a duo
game, the sample floor at exactly five, a null delta with no games apart, the streak signed by
result, champion pairings ranked by win rate with one-offs dropped, role pairings ranked by
frequency instead, per-game KDA averaging rather than dividing totals, and empty histories.

`duoService.test.ts` — new, and written directly against both bugs above: the account's rows are
selected by id _and_ puuid, the teammate scan excludes every PUUID the account has used, and the
exclusion is a list rather than a negated nullable column.

## Verified against real data

`kaanproak0#TR1`, 105 matches: `C0marKopter#TR1` at 73 games, 51% together against 70% apart —
a −18 point duo. Champion pairings `Alistar+Caitlyn` 9 games at 78% against `Veigar+JarvanIV` 6 at
67%; role pairings led by `UTILITY/BOTTOM` at 25 games. 73 + 32 = 105, and the partner header and
the panel figures now agree because both read the same row definition.

refs TASK-312
