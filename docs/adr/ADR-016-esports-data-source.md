# ADR-016: Esports Data Source (LoL Esports API + livestats feed)

## Status: Accepted

## Context

The product needs a public esports section: schedules, live scores, standings,
teams, rosters, players, match results, drafts and pro champion statistics. The
goal is audience acquisition — esports queries ("lec standings", "t1 roster",
"worlds schedule", "faker stats", "worlds pick ban stats") are high-volume,
recurring, and almost entirely served today by sites that do not also sell
coaching. The section must therefore be **free, public, crawlable, and cost
nothing per request**, exactly like the free tools in `src/domains/meta/`.

Sources considered:

- **Riot's official Esports API** — the documented `esports-api` product on the
  developer portal is limited to schedule/league metadata and requires a separate
  approval. It does not expose per-game statistics.
- **PandaScore / Abios / Bayes** — complete and contractual, but paid
  (four figures a month at the tier that includes game state). Defeats the
  zero-cost requirement for what is a top-of-funnel surface.
- **Leaguepedia (lol.fandom.com Cargo API)** — free, deep historical coverage
  (rosters, tournament results, player careers, picks & bans back to 2011).
  CC-BY-SA, attribution required. Probed during planning: returns
  `ratelimited` for anonymous requests from a shared IP even with a descriptive
  User-Agent, so it needs a courtesy-limited, heavily cached crawler rather than
  request-time fetching.
- **`esports-api.lolesports.com` (the feed the lolesports.com web client uses)** —
  free, no account, one well-known public key sent as `x-api-key`. Probed during
  planning; every endpoint the section needs returns 200:
  `getLeagues`, `getTournamentsForLeague`, `getSchedule`, `getLive`,
  `getCompletedEvents`, `getStandings`, `getTeams` (with rosters), `getEventDetails`.
- **`feed.lolesports.com/livestats/v1`** — the same client's game-state feed.
  `window/{gameId}` returns draft, per-player champion/role and rolling team gold
  and kills; `details/{gameId}` returns per-frame participant stats including
  **items and rune pages**. Works for completed games, not just live ones.

## Decision

Source the esports section from **`esports-api.lolesports.com` for structure**
(leagues, tournaments, schedule, standings, teams, rosters, matches) and
**`feed.lolesports.com/livestats/v1` for game state** (drafts, scoreboards, gold
curves, pro builds), isolated behind a new `src/domains/esports/` bounded context
with a single public API at `src/domains/esports/index.ts`.

Both feeds are **unofficial**, so the integration inherits the ADR-008 posture
wholesale:

- **Server-side only.** No browser ever talks to a Riot host; the live scoreboard
  polls our own rate-limited `/api/esports/live` route.
- **Zod at the boundary.** Every response is parsed into our own types. A shape
  change fails validation instead of reaching a page.
- **Fresh + last-good caching** through the existing `getCached`/`setCached`
  layer (ADR-014), with per-resource TTLs rather than one global number:

  | Resource | Fresh TTL | Rationale |
  |---|---|---|
  | Leagues, teams, rosters | 24 h | Changes at most between splits |
  | Tournaments, standings | 1 h | Moves after each match day |
  | Schedule (upcoming/completed) | 15 min | Times shift, results land |
  | Live events (`getLive`) | 30 s | It is the live surface |
  | Completed game stats | 30 days | Immutable once the game ends |

  Every key also writes a never-expiring `:last-good` snapshot. If a feed changes
  shape or goes down, pages serve the last good data with a visible "as of"
  timestamp instead of erroring.

- **No per-request AI and no database writes** in the read path. Phase 1 of the
  section is stateless: ISR pages over a cache. Anything that needs persistence
  (following a team, match reminders) is a separate, explicitly approved task.

The API key is the public constant embedded in the lolesports.com web client —
it is not a credential, it is not tied to our account, and it grants nothing
beyond public read access. It is still read from `LOLESPORTS_API_KEY` so it can be
rotated by config, with the published value as the documented default in
`.env.example`. It must not be treated as a secret in code review, and equally
must not be sent from the browser.

**Leaguepedia is deferred, not rejected.** The lolesports feed covers roughly the
current and previous season; historical depth (career histories, all-time
tournament results) is where Leaguepedia earns its keep. When it is added it gets
its own service, its own courtesy rate limit, a nightly refresh rather than
request-time fetching, and the CC-BY-SA attribution the licence requires.

## Consequences

- **Positive:** the whole section runs at zero marginal cost, with data depth
  (per-frame pro builds and gold curves) that paid competitors charge for. It
  reuses the caching, ISR and SEO machinery the free tools already proved.
- **Positive:** because everything is behind `src/domains/esports/index.ts`,
  swapping in a paid provider later is a service-level change, not a rewrite.
- **Negative:** dependency on two unofficial endpoints that Riot can change or
  block without notice. Mitigated by the last-good snapshots, the Zod boundary,
  and pages that degrade to "schedule only" rather than 500.
- **Amendment (2026-08-16): game length is derivable after all.** This ADR and
  the pages built on it recorded duration as something neither feed publishes,
  and so the section only ever showed per-game totals — "You vs the Pros"
  named CS/min and gold/min as rows it could not draw. It is not published as a
  field, but `window/{gameId}` **with no `startingTime` answers from the opening
  frames of the game**, and the closing frame is already fetched to build a
  scoreboard. The difference between the two timestamps is the game. Verified on
  three completed games (34:41, 25:34, 32:40) and cross-checked against the VOD
  segment offsets `getEventDetails` publishes for the same series, which run the
  expected few minutes longer for draft and post-game.

  It costs **one extra request per game**, cached for thirty days under
  `game:{id}:start` — for a live game too, since a game's first frame is
  immutable the moment it exists. `src/domains/esports/duration.ts` owns the
  derivation and rejects any span shorter than two minutes or longer than two
  hours: a repeated frame would otherwise report a zero-second game and send
  every rate derived from it to infinity. Where a game has no opening window,
  every per-minute figure is null and renders as an em dash rather than being
  computed against an assumed length.

- **Negative:** coverage is what Riot publishes. Tier-2 leagues have thinner
  livestats coverage, and `getStandings` returns brackets in a stage/section shape
  that varies by format — the standings service normalises this and must tolerate
  formats it has not seen.
- **Assets:** team, league and player images are served from
  `static.lolesports.com` and `lolstatic-a.akamaihd.net` (the payload sometimes
  gives `http://` URLs — upgrade to `https://` before use). Both hosts must be
  added to `next.config.mjs` `images.remotePatterns` and to the CSP `img-src`
  allowlist.
- **Legal:** the same footing as the free tools. Riot-owned assets and public
  esports data are used the way community esports sites commonly do, the section
  is free and never gated behind the paywall, and the "not endorsed by Riot Games"
  boilerplate plus a visible data-source credit stay on every esports page.
