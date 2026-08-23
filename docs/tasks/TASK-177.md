# TASK-177: Landing Redesign (English, Real Screenshots, Live Meta)

## Status: Pending

## Score: 92/100

## Goal

Rebuild the landing page: full English copy, real product screenshots instead
of CSS mockups, live patch-meta section, direct links to the public free tools,
and a zero-AI-cost demo search box.

## Scope

- Capture fresh product screenshots via Playwright (dashboard, counter picker,
  matchup, draft analyzer, tier list, coaching report) → `public/screenshots/`,
  render with `next/image`
- Rewrite all `app/(marketing)/components/` sections in English
- Replace CSS mockups in Hero/Features/ToolsShowcase with real screenshots
- New "Patch X.Y Meta" section — top 5 champions with real win rates from the
  meta domain, links to /tools/tier-list
- ToolsShowcase sections link directly to the public tools (not /register)
- `/api/public/preview`: replace AI insight with rule-based insight
  (KDA/win-rate/champion-pool heuristics) — anonymous surface becomes zero-AI-cost
- Keep LCP < 3s (hero poster is the LCP element)

## Out of Scope

- Pricing model changes; dashboard redesign

## Commit

`feat(landing): english landing redesign with real screenshots and live meta section`
