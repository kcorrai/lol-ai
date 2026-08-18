# ADR-031: The career timeline is derived, and honest about where it starts

## Status: Accepted

## Context

`/timeline` shows a player's League history as one chronological spine. The app already
holds plenty of time-stamped material — matches, rank snapshots, habits, achievements,
mastered lessons, past recaps — and until now nothing read any of it in order. `/recap`
is a 180-day deck, `/milestone` is one month, `/improvement` is a table.

Two facts about the Riot API decide what "career" can honestly mean:

- **match-v5 retains roughly two years.** Older games cannot be fetched at all.
- **Past-season ranks do not exist in the API.** `league-v4` answers for the current
  season only. Sites that show a 2019 rank show it because they recorded it in 2019.

A third fact decides how deep our own copy goes: `syncAccount` fetches the most recent
N match ids and never walks backwards (LA-36 is fixing that separately).

## Decision

**Nothing about the timeline is stored.** There is no `career_events` table.

- Events are assembled on read from the table that already owns the fact.
  `careerSourceEvents.ts` reads them; `careerEventBuilders.ts` finds the ones that have
  to be computed — champion eras and standing records.
- One narrow query over the player's ranked participants feeds every builder. Even
  fully backfilled that is on the order of a thousand rows of small scalars, so it is
  one pass in memory rather than a query per question. No raw SQL.
- Champion mastery is fetched once per sync and written onto the `ChampionStat` rows
  that already exist. It is the only figure on the page that predates the match window,
  and it is labelled as such rather than mixed into recent form.

**The page says where the record starts.** "Tracking since" — not "you started playing".

Three judgement calls are written down because they are the feature:

1. **A champion era is a run of consecutive months a champion spent as the most-played
   one.** Monthly rather than a rolling window of games, because that is the definition
   a player can check against their own memory.
2. **Only the standing record is emitted, pinned to the day it was set.** Emitting every
   time a record moved would fill a new player's first weeks with nothing else.
3. **Each month keeps its six heaviest events.** An active month is otherwise forty rows
   that all look the same.

## Consequences

- No migration, no job, no reconciliation. A corrected source row corrects the timeline.
- The timeline deepens by itself as the archive fills in — the read side is the same
  query whatever depth exists behind it.
- The judgement calls above are code, so changing one rewrites history: reword an era
  rule and past months regroup. That is the cost of deriving rather than storing, and
  it is the right trade while these definitions are still young.
- Curation hides events. The count of what was cut is returned as `trimmed` so the page
  can own that rather than quietly dropping things.
- Rank movements come only from `ranked_history`, which starts when we started sampling
  it (LA-10). A player's earlier climb is not recoverable and the page does not pretend
  otherwise.
