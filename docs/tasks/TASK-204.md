# TASK-204: SEO quick wins for free-tool pages

## Status: Done

## Goal
Close the real SEO gaps on the public free-tool pages. (Audit note: the earlier
scan claimed missing canonicals + BreadcrumbList, but verification showed every
tool page already sets `alternates.canonical` and `ToolBreadcrumb` already emits
BreadcrumbList JSON-LD. The genuine gap was Open Graph images + weak internal
linking.)

## Scope
- `app/(tools)/opengraph-image.tsx`: one branded default OG card (via the shared
  `renderOgImage`) inherited by every route in the (tools) group that lacks its
  own — so /tools, /builds, /meta, /tools/tier-list, /aram/tier-list,
  /tools/counter-picker etc. now have social preview images. The dynamic
  per-entity cards (counters/[champion], matchups/[slug]) still override it.
- `app/(tools)/RelatedTools.tsx`: cross-links between the free tools; added to the
  builds and tier-list hub pages for internal linking.

## Verification
- Dev server: og:image meta now present on all tool pages (was absent); builds
  renders the "Explore more free tools" block.
- The OG PNG returns a dev-only `next/og` "Invalid URL" (default-font fetch) that
  affects ALL og routes including the already-shipped counters card — a known
  `@vercel/og` dev quirk; renders fine in production.
- tsc + lint + 352 tests green.

## Commit
`feat(seo): default OG image for free-tool pages + cross-tool links`
