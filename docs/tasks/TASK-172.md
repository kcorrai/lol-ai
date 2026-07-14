# TASK-172: Programmatic SEO Counter Pages — /counters/[champion]

## Status: Pending
## Score: 93/100

## Goal
~170 statically generated per-champion counter pages targeting "X counters"
searches — the strongest SEO lever of this initiative.

## Scope
- `app/(tools)/counters/[champion]/page.tsx` — `generateStaticParams` from DDragon
  champion list, ISR 12h; content: best counters per role with win rates and sample
  sizes, splash-art hero (DDragon/CDragon), "weak against / strong against" sections,
  internal links (champion detail page ↔ counter page ↔ tier list ↔ counter-picker),
  `generateMetadata`, FAQ + BreadcrumbList JSON-LD
- Extend `app/sitemap.ts` with `/tools/*` and `/counters/*` routes
- Handle missing meta data gracefully (DDragon-only fallback content)

## Out of Scope
- Per-matchup pages (170×170 — intentionally excluded)

## Commit
`feat(seo): programmatic per-champion counter pages`
