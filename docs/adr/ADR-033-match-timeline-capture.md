# ADR-033: Match timeline capture

## Status: Accepted

## Context

`timelineService.fetchAndPersistDeathEvents` fetches the **full** Riot Match-V5 timeline
for every synced ranked match, walks every frame, keeps the `CHAMPION_KILL` events whose
victim is one particular player, and discards the rest. `getMatchTimeline`
(`riotApiClient.ts`) passes `cacheTtl: 0`, so each of those is a fresh network call —
20 matches per sync, 1.2s apart, against a rate-limit bucket shared with every other Riot
call in the app.

What is discarded is the only per-minute data the product can obtain: `participantFrames`
(gold, XP, level, CS for all ten players, sampled every 60s) plus ward, item, skill,
objective and building events. Every service in `src/domains/analysis/` reasons from
end-of-game totals, so nothing in the product can say *when* a game was lost — only that
it was.

The type is why it was never used. `MatchTimelineDTO` declared `frameInterval`,
`participants` and `frames[{timestamp, events}]` and nothing else; `participantFrames` was
absent entirely and every event other than `CHAMPION_KILL` fell into a
`{ type: string; [key: string]: unknown }` catch-all. There was no typed surface to build
against, so nobody built against it.

## Decision

Capture the timeline in full, into two new **match-scoped** tables, and read the first
surface off them: a lane-phase chart on `/match/[matchId]`.

### Match-scoped, not account-scoped

`match_death_events` is keyed by `(matchId, riotAccountId)`. That was right for a death
heat map, which is a fact about one player, but it means a match containing two of our
users is fetched and processed twice, and it cannot express any fact that involves two
players at once.

The new tables key on `matchId` alone and store **all ten participants**. One match is
captured once, whoever is in it. This is what makes "your gold difference against your
lane opponent" answerable at all — a per-player capture has no opponent to difference
against.

`match_death_events` and its two consumers (`heatmapService`, `teamfightService`) are left
exactly as they are. Migrating them onto the new tables is a real simplification and a
separate piece of work; bundling it here would put a rewrite of two working analysis
services inside a data-capture change.

### A typed enum for the event kind, `jsonb` for its tail

The eleven event kinds we parse are a Prisma enum, so a bad kind is a compile error rather
than a silent string. The kind-specific remainder — item id, monster subtype, skill slot,
ward type, assist ids — differs per kind and goes in a `payload jsonb` column, re-validated
by a zod schema on read.

This is the `saved_searches.filters` pattern (ADR-032): a column per facet across eleven
heterogeneous kinds would be forty mostly-null columns, and every new Riot event kind would
be a migration. Event kinds outside the enum are not stored at all — the union's catch-all
arm keeps them representable in TypeScript without `any`, and the parser drops them.

### No backfill

Newly synced matches get the full capture. Existing matches keep their death events and
nothing else; the chart renders an explicit "no timeline recorded for this match" state.

A backfill is not free the way the forward capture is: the forward capture rides a request
that is already being made, whereas re-processing history means one new Riot call per
historical match, against a bucket shared with live match syncs. That is a deliberate,
budgeted job and it is not this one.

## Consequences

**Costs**

- Roughly **350 frame rows and ~200 event rows per match** (a 35-minute game, ten
  participants, one frame per minute). This is the largest per-match write the app makes.
  Both writes are single `createMany` calls, not per-row inserts.
- `participantFrames` is keyed by the participant id **as a string** (`"1"`…`"10"`). A
  numeric index yields `undefined` for every participant and produces an empty capture
  rather than an error, so the parser is covered by a fixture test that would fail loudly.
- The capture is only as complete as the enum. Adding a twelfth event kind is a migration.

**Benefits**

- **Zero additional Riot requests.** The payload was already being fetched and paid for in
  full; this parses more of it. Request count, spacing and rate-limit budget are unchanged.
- Idempotent by construction: `@@unique([matchId, participantId, minute])` plus
  `createMany({ skipDuplicates: true })`, so a re-run needs no transaction and cannot
  double-write.
- Deduplication becomes per-match, so a match shared by two of our users stops being
  processed twice.
- Opens per-minute analysis to the rest of the product — lane phase, gold curves, vision
  timing, build paths, objective context — without another data acquisition step.
