# TASK-288: Riot policy review of the live-game feature

## Status: Done — no code change required

## Context

The live-game feature (`LiveGameButton` on `/tools/draft-analyzer` and
`/tools/matchup`, backed by `app/api/riot/live-game/route.ts` and
`liveGameService.getLiveDraft`) reads the player's *active* game from the
Spectator API. Two Riot rules could plausibly bite it, so it was reviewed
against the actual implementation before a production key application:

1. **Scouting is an unapproved use case** — "seeing an opponent's stats before a
   match starts".
2. **LoL policy** — "Products may not provide any game-session-specific
   information that would be previously unknown to the player", and apps "that
   dictate player decisions" are disallowed.

## Findings

**Not scouting.** The route is `withAuth` and calls
`assertOwnsRiotAccount(userId, riotAccountId)` before anything else, so a caller
can only read the game *they are currently in*. There is no path to query an
arbitrary player. (This also rules out the corresponding IDOR.)

**No opponent player data is read.** `getLiveDraft` uses the caller's own puuid
solely to locate the game, then reads champion IDs off the participants.
`LiveMatchup` is `{champion, opponent, position}` — champion names only. No rank,
match history, win rate or summoner data for any other player is fetched.

**Nothing previously unknown is revealed.** Every champion surfaced is already on
the player's own screen in champ select and the loading screen. Lane assignment
is *inferred* locally from meta position frequency (`assignLanes`), not read from
a privileged source, and the code itself instructs callers to present it as
correctable rather than certain.

**Not real-time assistance.** `LiveGameButton` has no `refetchInterval`, no
`setInterval` and no `useQuery` — a single `onClick` handler. The feature fetches
once when the player asks, and never polls.

**The advice is not game-session-specific.** `matchupGuideService` prompts for
"lane phase strategy, 1 mistake to avoid, gank timing, late game priority" for a
champion pair, weighted by the player's own historical W/L in that matchup. It
consumes no live game state. The identical guide could be read before queueing;
the live button only pre-fills which two champions to look up.

## Decision

**No code change.** The feature satisfies both rules as implemented, including
the stricter reading of the "previously unknown information" clause.

## The real risk is presentation, not policy

A reviewer skimming `/tools/draft-analyzer` sees a button labelled around a live
game and may classify the product as live-assistance software without reading how
it works. That is a rejection risk driven by appearance rather than substance.

Mitigation for the production key application (TASK-289): state explicitly that
the live lookup is manual and single-shot, is scoped to the applicant's own
account by an ownership check, reads only champion identities already visible to
the player, and drives general champion-matchup guidance rather than real-time
direction.

## Follow-up worth considering (not done here)

If Riot pushes back, the cheapest concession is restricting the lookup to champ
select rather than allowing it mid-game. `getLiveDraft` already returns
`gameLength`, so the gate is a comparison, not new plumbing. Not implemented now
because the feature is compliant as written and pre-emptively degrading it would
cost real product value.
