# TASK-179: SEO Internal Linking + Live Meta Counter

## Status: Pending

## Score: 88/100

## Goal

Strengthen the SEO internal-link graph and add a real "live" signal to the landing.

## Scope

- **Live match counter**: expose op.gg's `meta.match_count` on the snapshot
  (`MetaSnapshot.matchCount`) and show an animated "X ranked games analyzed this
  patch" figure on the hero and in the meta section (real number, not fake).
- **Breadcrumbs on tool pages**: shared `ToolBreadcrumb` (nav + BreadcrumbList
  JSON-LD) on counter-picker, matchup, draft-analyzer, tier-list.
- **Related champions**: a "Popular this patch" links row on the counter picker and
  a "More counter guides" row on `/counters/[champion]`, both linking to other
  `/counters/*` pages (from the tier list / snapshot).
- **Champion detail → counter cross-links**: `/champions/[name]` links to
  `/counters/[name]`; keep the counter page → champion guide link.

## Out of Scope

- New tools; per-matchup pages.

## Commit

`feat(seo): internal linking graph + live meta counter`
