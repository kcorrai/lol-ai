# ADR-017: Keep our own index of Riot IDs for search

## Status: Accepted

## Context

The product asks a player to know their exact Riot ID — name *and* tag — and to pick the right
platform, before it will show them anything. Competing sites do not: on tracker.gg you type
`fak`, a list of real accounts drops down, you click one, and the profile loads. Nothing is
connected, nothing is verified, nothing is waited for. That absence of friction is a large part
of why those sites acquire the traffic they do, and matching it is the point of TASK-308 onward.

The obvious implementation — "call Riot's search endpoint as the user types" — does not exist.
The Riot API has no name-search or prefix-lookup of any kind. `account-v1` resolves a Riot ID
only when given a complete, exactly-spelled `gameName` **and** `tagLine`; there is no endpoint
that takes `fak` and returns candidates. Autocomplete against Riot is therefore not something we
have chosen not to do, it is something no client can do.

What we do have is a large and growing corpus of Riot IDs that arrived for free. Every match we
sync stores all ten participants (`matchMapper.ts` maps the whole `info.participants` array),
each with `puuid`, `gameName` and `tagLine`. Nine of those ten are nobody's connected account.
A single user's first sync therefore contributes several hundred distinct Riot IDs, and a local
development database with two seeded accounts already holds 815 of them.

The alternatives considered were:

1. **Prefix-search `match_participants` directly.** No new table. But it is the largest table in
   the schema, region lives on `matches` rather than on the participant row so every query needs
   a join, and the same player appears once per match, so the query would have to deduplicate
   hundreds of thousands of rows on every keystroke.
2. **A search service (Elasticsearch, Typesense, Algolia).** Correct at a scale we are nowhere
   near, and a new dependency, a new failure mode and a new bill for a prefix match.
3. **A dedicated index table maintained by sync.**

## Decision

Maintain a `player_index` table: one row per `puuid`, holding the Riot ID, region, an appearance
counter, and a lowercased `searchKey` for matching.

Three things follow from that shape and are worth stating:

- **The lowercased column is stored, not computed.** `ILIKE 'fak%'` cannot use a btree index.
  `searchKey LIKE 'fak%'` against an index declared with `text_pattern_ops` can, and that is the
  only reason autocomplete stays fast as the table grows. Both are declared in the schema via
  `@@index([searchKey(ops: raw("text_pattern_ops"))])`.
- **Writes are bulk, never per row.** Prisma has no bulk upsert, and a first-time sync carries
  several hundred distinct players; one upsert each would put hundreds of round trips inside the
  sync path. `indexPlayers` instead runs a fixed handful of statements whatever the batch size.
- **`seenCount` is the ranking signal.** A name that appears in fifty of our matches is a likelier
  target than one seen once. It counts appearances rather than syncs, so a duo partner who is in
  thirty of your games ranks above a stranger from one.

Indexing failures are swallowed. The cost of a failed write is a missing autocomplete row; the
cost of letting it propagate is a failed match sync.

## Consequences

**Gained.** Autocomplete at all, which the Riot API cannot provide. It costs no Riot calls — the
data is a by-product of syncs we already run. Coverage compounds: every new user makes search
better for every other user, which is the same flywheel the competition is running.

**Given up.** The index only knows players who have shared a match with one of our users, or who
have connected an account. A brand-new server's player base is invisible until someone syncs a
match containing them. The mitigation is the exact-Riot-ID escape hatch — when the index has no
hit, search offers to resolve the typed `Name#TAG` against Riot directly — so the index being
incomplete degrades autocomplete rather than blocking the search.

**Carried.** Riot IDs change, and a stored copy goes stale. Sync corrects a drifted name when it
next sees the player, so the index self-heals for active players and keeps a stale name for
inactive ones. That is the right trade: an inactive player's old name is the name someone
searching for them is most likely to type.

**Watch.** The table grows without bound and nothing prunes it. At current volume that is
irrelevant; a row is roughly 150 bytes, and even ten million players is manageable. If it ever
matters, the eviction rule is `lastSeenAt`, not `seenCount`.
