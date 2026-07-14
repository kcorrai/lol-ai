# TASK-173: Dynamic OG Images + SEO Infra Polish

## Status: Pending
## Score: 80/100

## Goal
Auto-generated Open Graph images for the new SEO pages and a metadata audit.

## Scope
- `next/og` ImageResponse routes (`opengraph-image.tsx`) for: counter pages
  (champion splash + top counters overlay), tier list (top champs + patch),
  tools hub
- `metadataBase` + canonical URL audit across marketing/tools pages
- robots verification, SoftwareApplication JSON-LD on tools hub
- Riot "not endorsed" legal boilerplate in footer if missing

## Out of Scope
- Paid social assets

## Commit
`feat(seo): dynamic og images + metadata polish`
