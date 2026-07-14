# TASK-182: Champion Build Pages — /builds/[champion] (+ per-lane)

## Status: Pending
## Score: 95/100

## Goal
"[champion] build" is the highest-volume LoL search pattern (u.gg has ~875 such pages).
Publish role-aware build pages powered by getChampionBuild.

## Scope
- `app/(tools)/builds/[champion]/page.tsx` (most-played lane) +
  `app/(tools)/builds/[champion]/[role]/page.tsx` (top/jungle/mid/bot/support slugs) —
  only lanes with pickRate ≥ 2 get pages (~350-450 total).
- Components in `src/domains/meta/components/build/` (<200 lines each): RunePanel,
  ItemBuildPath (starters → core → boots → late options), SkillOrderStrip, SpellsRow,
  GameLengthCurve, TrendLine.
- 200+ word generated intro + build-reasoning text embedding the page's real numbers
  (win rate, sample, curve shape) — unique per page, zero AI calls.
- Metadata "X Build, Runes & Skill Order — Patch 26.13 | LoL AI Coach";
  VideoGame + ItemList + FAQPage + BreadcrumbList JSON-LD.
- generateStaticParams: prerender top ~50 champions only; `dynamicParams = true`, ISR 12h.
- Internal links: build ↔ counters ↔ champion guide ↔ tier list; sitemap additions.

## Commit
`feat(seo): champion build pages with runes, items, skill order and win curves`
