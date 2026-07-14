# TASK-186: /meta Patch Report — Winners & Losers

## Status: Pending
## Score: 87/100

## Goal
An evergreen `/meta` page ("LoL Patch 26.13 Meta Report — Winners & Losers") that
refreshes each patch. Stable URL accumulates authority; fresh title/content each patch.

## Scope
- Top ~10 climbers and fallers from `rank_prev_patch` deltas (weighted by pick rate),
  each with trend context (per-patch WR) and links to its build + counter pages.
- Patch-notes link via the fixed `buildPatchNotesUrl` (game-patch format).
- 200-word generated summary embedding real numbers; visible "Data updated" strip;
  FAQ + ItemList JSON-LD; fresh title per patch.
- Nav/footer + tools hub links; sitemap entry with real lastmod.

## Commit
`feat(seo): patch meta report page with winners and losers`
