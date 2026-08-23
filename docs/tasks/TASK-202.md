# TASK-202: Rich public champion pages (abilities, videos, skins)

## Status: Done

## Goal

The public `/champions/[name]` SEO pages are thin (splash, blurb, base stats, 3
tips). Turn each into a rich, attractive guide: full ability breakdown with
icons + official ability videos, a skins gallery, a combat-identity readout and
full lore — all from official Riot CDNs (hotlink-safe, verified live).

## Data sources (all verified)

- Ability icons: `cdn/{ver}/img/spell/{image.full}` and `.../img/passive/{image.full}`
- Ability videos: `d28xe8vt774jo5.cloudfront.net/champion-abilities/{key4}/ability_{key4}_{P1|Q1|W1|E1|R1}.webm`
  where `key4` = the DDragon numeric `key` zero-padded to 4 digits (e.g. Ahri 103 → 0103).
  Verified 200 across old/new champions and all 5 slots; unpadded → 403.
- Skins: `skins[]` (num, name, chromas) from the champion JSON →
  `cdn/img/champion/splash/{Key}_{num}.jpg`.
- The per-champion JSON already fetched by `fetchChampionDetail` contains spells
  (image/tooltip/cooldownBurn/costBurn/rangeBurn), passive.image, skins and full
  lore — only the TS type discarded them.

## Scope

- `next.config.mjs`: add `media-src 'self' https://d28xe8vt774jo5.cloudfront.net`
  to the CSP (default-src is 'self', so <video> is otherwise blocked).
- `src/lib/ddragon.ts`: add `spellIconUrl`, `passiveIconUrl`, `abilityVideoUrl`.
- `src/lib/ddragon/championsData.ts`: widen `DdragonChampionDetail` (spells full,
  passive.image, skins) and add `cleanAbilityText` (strips `{{ }}` vars + HTML tags).
- `ChampionAbilities.tsx` (client): P/Q/W/E/R selector → large autoplaying muted
  looped video + icon + cleaned description + cooldown/cost/range chips.
- `ChampionSkins.tsx` (server): responsive splash gallery with skin names.
- `app/(marketing)/champions/[name]/page.tsx`: rewrite as orchestrator (wider
  layout, combat-identity bars, abilities, skins, full lore, tips); enrich
  metadata/JSON-LD with ability keywords. Keep every file under its size limit.

## Tests

tsc + lint + vitest green. Visual review on the Vercel preview after deploy.

## Commit

`feat(champions): rich public champion pages — abilities, videos, skins`
