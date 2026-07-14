# TASK-166: Meta Data Foundation (Zero-Cost Data Layer)

## Status: Pending
## Score: 95/100

## Goal
Create the zero-API-cost data backbone for all free tools: a new `meta` domain
that sources patch-current champion stats (win/pick/ban rate, tier, per-position
counters) from OP.GG's public JSON endpoint, plus a dynamic Data Dragon version
(currently hardcoded to 15.14.1 — a year out of date; latest is 16.13.1).

## Scope
- `src/lib/ddragon.ts`: replace `DDRAGON_VERSION = "15.14.1"` with a cached
  dynamic fetch of `https://ddragon.leagueoflegends.com/api/versions.json`
  (12h cache, keep a hardcoded fallback constant). Update all call sites.
- New domain `src/domains/meta/`:
  - `types.ts` — `ChampionMetaStats`, `PositionStats`, `CounterEntry` (`{championId, play, win}`)
  - `services/metaStatsService.ts` — fetch
    `https://lol-api-champion.op.gg/api/global/champions/ranked` (bulk, one request),
    validate with Zod, cache in Redis 12h TTL + permanent `meta:snapshot:last-good`
    fallback key, descriptive User-Agent, map op.gg `champion_id` ↔ DDragon `champion.key`
  - `index.ts` — domain public API
- Unit tests (mocked fetch): happy path, API error → snapshot fallback, malformed data
- ADR: "External meta-stats source (op.gg) for free tools" in `docs/adr/`
- Note in `docs/DEPENDENCIES.md` (no new packages)

## Out of Scope
- Tool pages/UI (TASK-167..170)
- Removing AI routes

## Commit
`feat(meta): add zero-cost meta stats domain with op.gg source + dynamic ddragon version`
