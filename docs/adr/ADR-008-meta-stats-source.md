# ADR-008: External Meta-Stats Source (OP.GG) for Free Tools

## Status: Accepted

## Context

The free tools (counter picker, matchup analyzer, draft analyzer, tier list) are
being made public for SEO and must run at **zero AI/API cost**. They need
patch-current champion statistics — win/pick/ban rates, tier, and per-lane
counter matchups — that we cannot derive cheaply from our own database (we only
have our users' matches, not the global ladder).

Options considered:
- **Riot Match-V5 aggregation** — would require crawling millions of ranked games
  under our rate-limited key. Infeasible and expensive.
- **Data Dragon only** — free and official, but has no win-rate/meta data.
- **Paid stats APIs** (RapidAPI tiers, etc.) — recurring cost, defeats the purpose.
- **OP.GG public JSON feed** (`lol-api-champion.op.gg/api/global/champions/ranked`)
  — free, no key, one request returns every champion's win/pick/ban rate, tier,
  per-position stats, and counter matchups. Verified patch-current (feed exposes
  `meta.version`, e.g. `16.13`).

## Decision

Source global meta stats from the OP.GG public ranked feed, isolated behind a new
`src/domains/meta/` domain (mirroring the `riot` domain's isolation rule). The
feed is **unofficial**, so the integration is defensive:

- Fetched **server-side only**, at most ~2×/day regardless of traffic (12h fresh
  cache via the existing `aiCache` layer; all tool pages are ISR).
- A never-expiring `meta:snapshot:last-good` snapshot is kept as a fallback; if the
  feed changes shape (Zod validation fails) or goes down, tools serve the last good
  data instead of erroring.
- Data Dragon remains the source of truth for champion identity, images, and base
  stats; the meta feed only augments it. If OP.GG disappears entirely, tools
  degrade to Data Dragon-only content behind the same `getMetaSnapshot()` interface.

The Data Dragon version, previously hardcoded to `15.14.1`, is now fetched live via
`getLatestDdragonVersion()` (12h cache, hardcoded constant as fallback for
synchronous client image URLs).

## Consequences

- **Positive:** free, patch-current stats; single request covers all champions;
  clean swap-in point (`metaStatsService`) for an alternative source (u.gg, Meraki)
  if needed.
- **Negative:** dependency on an unofficial endpoint that could change or block us.
  Mitigated by the last-good snapshot fallback and the isolating interface.
- **Legal:** stats and Riot-owned assets are used the way community tools commonly
  do; keep the "not endorsed by Riot Games" boilerplate in the footer.

## Addendum (Phase 7): mode and rank-tier variants

`getMetaSnapshot({ mode, tier })` now fans out to per-variant cache keys
(`meta:snapshot:<mode>:<tier>:fresh` / `:last-good`):

- **`mode`** — `"ranked"` (default) or `"aram"`. ARAM uses the `/champions/aram` bulk
  feed and the `/aram/{id}/NONE` detail endpoint; its `positions` field is `null`
  (not `[]`) and it has no ban data, both handled in the schema/UI.
- **`tier`** — op.gg rank bracket (`gold_plus`…`challenger`); omitted = op.gg default
  (emerald+). Only applied to ranked. Rank-filtered pages are `noindex`.

The per-champion detail endpoint (`championDetailService`) mirrors the same variant
keys. All variants share the same 12h-fresh + never-expiring last-good policy.
