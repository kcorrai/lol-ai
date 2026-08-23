# TASK-287: Detect and purge GDPR right-to-be-forgotten accounts

## Status: Done

## Context

Riot requires every API consumer to honour the GDPR right to be forgotten. From
Riot's own Dev Rel page (https://www.riotgames.com/en/DevRel/gdpr-right-to-be-forgotten-compliance):

- When a player is forgotten, Riot renames the summoner to **`rtbf(summonerID)`**
  — "player with summonerID 12345 will now be listed as rtbf12345" — and sets the
  account level to 1.
- Developers must watch for that marker and remove "any associations with the
  account that you may have".
- Riot recommends "updating the accounts of players at least once every 30 days".

**We do none of this today.** A grep for `rtbf` / `forgotten` across `src/` and
`app/` returns nothing. This is a live compliance gap and a plausible blocker for
a production key application.

### The exposure is wider than connected accounts

`MatchParticipant` (`prisma/schema.prisma:376`) stores `puuid`, `gameName` and
`tagLine` for **all ten players in every ingested match** — including the nine who
never used this product. Its `riotAccount` relation is optional and carries **no
`onDelete: Cascade`**, so deleting a `RiotAccount` only nulls `riotAccountId` and
leaves the identifying columns behind.

So a forgotten player's Riot ID can persist in our database even though they never
signed up here. Purging only `RiotAccount` rows would look compliant while missing
the majority of the retained personal data.

## Decision

**Detection** — an account is treated as forgotten when the Riot ID returned for
its `puuid` matches `/^rtbf\d*$/i`, or when account-v1 returns 404 (account gone).

`summonerLevel === 1` is deliberately **not** a trigger. Riot does set level 1 on
forgotten accounts, but level 1 is also every genuinely new player, so keying on it
would delete real users' data. It is recorded as corroborating detail only.

**Scheduling** — a daily Inngest cron processes a bounded batch of the accounts
whose `lastSyncedAt` is null or older than 30 days. `lastSyncedAt` already encodes
exactly "when we last confirmed this account against Riot", so no migration is
needed. Actively-synced accounts are refreshed by the sync path itself.

**Purge** — for a forgotten `puuid`:

1. Scrub the identifying columns on every `MatchParticipant` row for that puuid
   (`gameName`/`tagLine` → null). The rows are kept so match aggregates stay
   intact; what remains is the pseudonymous puuid, not a human-identifiable name.
2. Delete any `RiotAccount` rows for that puuid, which cascades to the owner's
   derived data (stats, reports, plans, habits, death events, duo partners).

Scrub-then-delete order matters: deleting first would null out `riotAccountId` and
lose the ability to find those rows by account.

## Consequences

- Batch size is capped per run and logged, so a backlog drains over several days
  rather than exhausting the Riot rate limit in one burst. The cap is visible in
  the logs — a silent cap would read as "everything checked".
- Purges are irreversible by design; every one is logged with the puuid prefix.
- Riot's documented marker predates Riot IDs, so the name is checked on both the
  account-v1 `gameName` and the summoner-v4 `name`.

## Out of scope

- Detecting the marker inline during match sync (worth doing; separate task).
- Backfilling a `lastRtbfCheckAt` column — deliberately avoided to stay clear of a
  schema migration (CLAUDE.md §8.2).
