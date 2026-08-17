# ADR-024: The daily quiz derives its puzzles instead of storing them

## Status: Accepted

## Context

We wanted a daily puzzle section (LA-20). The category is proven — LoLdle alone
reports around 5M pageviews a month — and the two biggest LoL companion apps,
Blitz and Mobalytics, ship nothing like it, so there is a gap a stats product is
unusually well placed to fill.

Three decisions had to be made before any of it could be built.

**How a day's puzzle gets chosen.** The obvious pattern was already in the
codebase: `challengeGenerator.ts` is an Inngest cron that writes a row per user
per day. Copying it would have been the path of least resistance.

**How the answer stays secret.** A quiz whose answer is in the page is not a
quiz. Data Dragon makes this sharper than it sounds: its asset paths *are* the
answer — `/img/spell/AatroxQ.png`, `/img/champion/splash/Aatrox_0.jpg`.

**Where champion facts come from.** Classic mode needs gender, species, region,
resource, range, position and release year per champion.

## Decision

**Puzzles are derived from the UTC date, not stored.** `pickDaily` deals from a
deck shuffled by `hash(mode + cycle)` and indexed by the day number. No cron, no
rows, no writes.

**Answers are graded server-side** and never serialised into a response until
the player has solved or given up.

**Assets are proxied** through `/api/quiz/asset/[mode]`, cached until exactly the
next UTC midnight.

**Champion facts are compiled into the repo** by `scripts/syncQuizChampionData.ts`,
which merges Data Dragon and Meraki with a hand-curated overlay and writes
`championAttributes.json`. Gender and species have no live source anywhere — Data
Dragon, CommunityDragon, Meraki, Riot's Universe API (403) and the Fandom wiki
(402) were all checked — so those are hand-maintained, as they are in every game
in this category.

## Consequences

**A cron could not have served an anonymous visitor at all**, and anonymous play
is the whole top of the funnel. It would also have left the day blank whenever
the job failed, and been awkward to test. The derived version is a pure function:
a test fast-forwards two years in a loop and checks every adjacent pair.

**Dealing from a deck buys a property picking at random does not**: no champion
reappears until the roster is used up. The deck boundary needed a guard the tests
found — reshuffling let the last card of one deck be the first of the next, so
the same answer could land two days running.

**Compiling the dataset removes a whole failure mode.** LA-13 is a live bug where
a Data Dragon outage 500s any page holding a stale fetch-cache entry; the quiz
cannot hit it, because at request time it reads a committed file. The cost is
that a champion release needs the script run and the diff reviewed — and the
script fails loudly rather than shipping a champion with no curated row, which
would become an unanswerable puzzle on whatever day the deck dealt it.

**The asset proxy costs a request hop** and is the only part of the runtime that
touches Data Dragon. In exchange, the visual modes are actually playable: without
it the network tab solves them.

**Practice mode falls out almost free** — the same engine with a client-supplied
seed instead of the date. Because practice never consults the date, no seed
reproduces the day's puzzle.

**Quote coverage is partial and will stay that way.** Voice lines have no
programmatic source at all, so each is hand-entered; the mode deals only from
champions that have one. A half-remembered quote costs a player an unanswerable
day, so the bar is confidence rather than coverage.
