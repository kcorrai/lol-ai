# TASK-171: Tools Hub, Public Access, Redirects, Nav

## Status: Pending
## Score: 92/100

## Goal
Wire everything together: public `/tools` hub with marketing chrome, remove
auth gating for tools, 301 redirects from old URLs, updated navigation.

## Scope
- `app/(tools)/layout.tsx` — marketing header/footer wrapper
- `app/(tools)/tools/page.tsx` — hub page with cards for the 4 free tools
- `middleware.ts` — remove `/counter`, `/matchup`, `/draft` from PROTECTED_PATHS
  and the matcher list
- `next.config.mjs` — permanent redirects:
  `/counter → /tools/counter-picker`, `/matchup → /tools/matchup`,
  `/draft → /tools/draft-analyzer`
- `src/components/layout/Sidebar.tsx` — update tool links to new URLs, English labels
- Marketing header (`app/(marketing)/components/MarketingHeader.tsx`) — add
  "Free Tools" nav link/dropdown
- E2E test: anonymous user reaches all 4 tools from landing without login redirect

## Out of Scope
- Landing page redesign (TASK-177)

## Commit
`feat(tools): public tools hub, auth unlock, redirects and nav`
