# TASK-006 — Match History UI

**Phase:** 1 — MVP  
**Status:** Not Started  
**Estimated Effort:** 2 days

---

## Objective

Build the match history page and match detail page. This is the primary data surface users see after connecting their account.

---

## Acceptance Criteria

- [ ] `/matches` page shows last 20 ranked games in a list
- [ ] Each match row shows: champion icon, champion name, position, KDA, CS/min, vision score, result (W/L), game duration, time ago
- [ ] Win/Loss is visually distinct (green/red background tint on card)
- [ ] Clicking a match opens `/matches/:matchId` detail page
- [ ] Detail page shows: full stat breakdown for the tracked player + all 10 participants
- [ ] Loading state: skeleton cards shown while data loads
- [ ] Empty state: "No matches found. Make sure your account is synced." if no data
- [ ] Filter bar: filter by queue type (All / Ranked Solo / Normal)
- [ ] Filter by champion (dropdown with played champions)
- [ ] Pagination: "Load more" button (not infinite scroll for MVP)
- [ ] Page works correctly on mobile (responsive)

---

## Technical Requirements

### Data Fetching

- Match list: Server Component fetches first 20, client-side TanStack Query handles pagination
- Match detail: Server Component with streaming (Suspense)
- API: `GET /api/matches` and `GET /api/matches/:matchId` (built in TASK-005 scope or parallel)

### Components to Build

`src/domains/analysis/components/` (or `src/domains/riot/components/`):
- `MatchHistoryList` — wraps list of MatchCard
- `MatchCard` — single match row
- `MatchDetail` — full match breakdown
- `ParticipantRow` — single participant in match detail
- `MatchFilterBar` — queue type + champion filter
- `KDADisplay` — colored KDA display (green if > 3, red if < 1)
- `MatchResult` — "Victory" / "Defeat" badge with appropriate color

### Champion Icons

Champion icons come from Riot's Data Dragon CDN:
```
https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{championKey}.png
```
Use Next.js `<Image>` component with explicit width/height to avoid CLS.

---

## Pages to Build

- `app/(app)/matches/page.tsx`
- `app/(app)/matches/[matchId]/page.tsx`

---

## API Endpoints Needed

- `GET /api/matches` — must be built before or in parallel
- `GET /api/matches/:matchId`

If endpoints are not ready, use mock data in a `fixtures/` folder during development.

---

## Dependencies

- TASK-001 (project setup)
- TASK-002 (auth — page is protected)
- TASK-005 (match sync — data must exist)

---

## Notes

Do not show champion performance stats on this page. That is TASK-007. This page is solely about individual match history, not aggregated stats.
