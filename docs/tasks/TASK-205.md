# TASK-205: Split oversized marketing components

## Status: Done

## Goal

Two landing components exceeded the 200-line React-component limit (missed by the
earlier TASK-201 sweep).

## Scope

- `FeaturesSection.tsx` (239 → 105): extracted the three product mockups
  (ReportPreview, CounterPreview, ChampionPreview) + ddragon URL helpers into
  `FeaturePreviews.tsx` (135).
- `PricingContent.tsx` (212 → 154): extracted the static B2B/Esports pitch into
  `PricingB2BSection.tsx` (67); PricingContent stays the client plan-toggle.

## Tests

No behavior change. tsc + lint + 352 tests green.

## Commit

`refactor(marketing): split FeaturesSection and PricingContent under 200 lines`
