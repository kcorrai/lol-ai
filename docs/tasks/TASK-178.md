# TASK-178: Docs, Final QA Sweep, Push

## Status: Pending

## Score: 90/100

## Goal

Close out: documentation updates, full verification pass, single push to main.

## Scope

- `docs/API_DESIGN.md` — remove deleted AI tool routes, add new pages/routes
- `docs/PROJECT_STRUCTURE.md` — meta domain, (tools) route group
- README — free tools section (English)
- QA sweep:
  - `npm run typecheck && npm run lint && npm run test` green
  - E2E happy paths: anonymous tools usage, demo search, register
  - Old URLs 301 → new tool URLs
  - Turkish-character sweep clean (user-facing strings)
  - `/counters/yasuo` renders with current-patch data + valid JSON-LD
  - sitemap includes new routes; OG image routes return images
  - Landing: poster paints first, 3D lazy-loads, reduced-motion static,
    live meta shows real win rates
- Final: `git push origin main`, then production smoke test on Vercel

## Out of Scope

- New features

## Commit

`docs: update api design and structure for public tools`
