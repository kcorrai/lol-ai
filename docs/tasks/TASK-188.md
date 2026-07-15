# TASK-188: SEO Infra Polish — Freshness, Noindex Params, Footer Hub

## Status: Done
## Score: 89/100

## Goal
Technical-SEO layer from the research: real freshness signals, crawl-budget hygiene,
site-wide internal links.

## Scope
- Visible "Data updated Xh ago · Patch 26.13 · N games analyzed" strip on all data pages
  (snapshot fetchedAt/matchCount); JSON-LD `dateModified` = fetchedAt.
- sitemap.ts: real `lastMod` (snapshot fetchedAt for data pages); add builds/matchups/
  aram/meta/role-hub routes.
- `robots: { index: false }` + canonical via generateMetadata on ALL tool pages when
  query params are present (counter-picker?champion, matchup?a/b, tier-list?tier,
  draft-analyzer?blue/red).
- MarketingFooter link hub: role tier lists, builds, ARAM, meta report, top-10 popular
  champion builds/counters (from snapshot).
- `/tools` hub + landing ToolsInAction: add Builds / ARAM / Meta report cards.

## Commit
`feat(seo): freshness signals, noindex params, footer link hub, sitemap lastmod`
