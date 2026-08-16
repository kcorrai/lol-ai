# ADR-017: Esports URL Structure and Indexation Rules

## Status: Accepted

## Context

The esports section is built for search. That makes its URL structure a one-way
door: every URL we publish is a URL we have to keep working, because it will be
linked, indexed and (for the good ones) ranked. It also multiplies fast — leagues
× tournaments × teams × players × matches × champions is thousands of pages, and
a careless shape produces near-duplicate pages that compete with each other and
with the existing free tools at `/tools`, `/builds`, `/counters` and `/champions`.

Two questions had to be settled before any page is written: what the paths look
like, and which of the generated pages are allowed into the index.

## Decision

### 1. Everything lives under `/esports`

A single crawlable hub with one topical prefix, rather than scattering
`/schedule`, `/teams`, `/players` at the root. It keeps the esports cluster
separable from the champion/build cluster in reporting and internal linking, and
leaves the root namespace free.

```
/esports                              Hub: live now, today, leagues
/esports/schedule                     All matches (?league= filter, ?date= paging)
/esports/vods                         Recorded series, game by game (?league= filter)
/esports/leagues                      League index
/esports/leagues/[slug]               League hub: standings + schedule + teams
/esports/tournaments/[slug]           Tournament: bracket, standings, champion meta
/esports/teams                        Team index
/esports/teams/[slug]                 Team: roster, results, upcoming, champion pool
/esports/players/[slug]               Player: role, team, champions, stats
/esports/matches/[matchId]            Match: result, per-game drafts, scoreboards
/esports/champions                    Pro pick/ban/win table
/esports/champions/[champion]         Champion in pro play + pro builds
```

### 2. Slugs come from the feed, IDs never appear in a slug except for matches

Leagues, tournaments, teams and players all carry a stable `slug` in the feed
(`lec`, `t1`, `lec_split_3_2026`) — use it verbatim, lowercased. Matches have no
slug, only a numeric id, and two teams can meet many times, so match URLs are
`/esports/matches/[matchId]` with the human context in the `<title>`
("T1 vs Gen.G — LCK Split 3 2026, Week 4"). A `?g=2` query selects the game
within a series; game 1 is the canonical view.

Champion slugs reuse the existing convention from `/builds/[champion]` and
`/champions/[name]` (Data Dragon ids, lowercased) so the cross-links between the
esports cluster and the champion cluster are mechanical rather than mapped.

### 3. Filters are query params, and query params are not indexed

Role, league, date-range and rank-style filters stay as `?param=` on the canonical
path. Every filtered view sets `alternates.canonical` to the unfiltered path, and
any view with a filter applied is `noindex, follow` — the same rule the
rank-filtered tier lists already follow (ADR-008 addendum). The one exception is
the league filter on `/esports/schedule`, which resolves to the league's own hub
page instead of a filtered duplicate.

### 4. Pages with no content do not get published

A team with no upcoming matches and no completed games, a player with no recorded
games, a champion with zero pro picks this season — all render a real empty state
but are excluded from the sitemap and marked `noindex, follow`. Thin pages at
scale are the failure mode of every auto-generated esports site; the section
should publish fewer, fuller pages.

### 5. Rendering: ISR everywhere, one polling island

Every page is a Server Component with `revalidate` matched to its data's TTL
(ADR-016) — 24 h for team and player pages, 1 h for standings, 15 min for the
schedule, 5 min for the hub. The only client-side fetching in the section is the
live scoreboard, which polls our own `/api/esports/live` route through a React
Query hook in `src/hooks/`, per the frontend rule that components never fetch
directly. A live match page upgrades itself the same way; when nothing is live,
nothing polls.

### 6. Structured data per page type

`SportsEvent` for matches, `SportsTeam` for teams, `Person` for players,
`ItemList` for standings and champion tables, `BreadcrumbList` everywhere. The
breadcrumb trail mirrors the path exactly, which is also what makes the internal
linking coherent: hub → league → tournament → match → player, each level linking
both down and up.

### 7. Old URLs are permanent

If a slug changes upstream (a team rebrands), the old path issues a
`permanentRedirect` to the new one rather than 404ing. Redirect entries live in
`next.config.mjs` beside the existing tool redirects.

## Consequences

- **Positive:** one prefix, one canonical per view, and a hard rule against thin
  pages — the three things that decide whether a large generated section
  compounds or gets filtered.
- **Positive:** slug reuse means `/esports/champions/ahri` ↔ `/builds/ahri` ↔
  `/champions/ahri` link to each other without a translation table, which is where
  the esports traffic gets handed to the product.
- **Negative:** deriving player and team pages from feed slugs couples our URLs to
  Riot's naming. The redirect rule is the mitigation, and it has to actually be
  maintained when a rebrand happens.
- **Negative:** the no-thin-pages rule means the sitemap is computed from real
  data rather than enumerated, so sitemap generation costs a cached read of the
  team, player and champion indexes on every build/revalidate.
