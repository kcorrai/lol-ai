# TASK-183: Matchup SEO Pages — /matchups/[a]-vs-[b]

## Status: Pending
## Score: 93/100

## Goal
Competitor research confirmed NO major site publishes dedicated indexed X-vs-Y pages —
high-intent queries ("yasuo vs zed") are unowned. Fill the gap.

## Scope
- `matchupPairsService` in meta domain: enumerate pairs from the cached counters of all
  champions (most-played lane), sample ≥ 1,000 games, dedupe symmetric, cap ~2,000 pages.
- `app/(tools)/matchups/[slug]/page.tsx` — slug `aatrox-vs-ahri`, alphabetical order is
  canonical (reverse order 308s). Content: head-to-head WR + sample size, overlaid
  game-length curves, each side's core build/runes mini-summary, lane tips, 150+ word
  generated analysis, FAQ + BreadcrumbList JSON-LD, links to both champions' builds/counters.
- generateStaticParams: prerender top ~200 pairs; dynamicParams + ISR 12h for the rest.
- Cross-links: matchup TOOL result → "Full X vs Y guide →"; counter-page rows link to
  matchup pages when one exists. Sitemap additions.

## Commit
`feat(seo): dedicated champion-vs-champion matchup pages`
