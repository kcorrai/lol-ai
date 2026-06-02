# TASK-016 — Match Detail Page

**Phase:** 1 — MVP  
**Status:** Complete  
**Estimated Effort:** 1 day  
**Depends on:** TASK-004 (match data), TASK-005 (analysis calculators), TASK-006 (app shell)

---

## Objective

Build a dedicated match detail page that shows the full scoreboard, individual performance breakdown, and any AI coaching insight linked to that match. This is the "zoom in" experience — the user clicks a match row on the dashboard and sees everything about it.

---

## Acceptance Criteria

- [x] Clicking a match row on the dashboard navigates to `/match/[matchId]`
- [x] Page shows match overview: game mode, duration, date, win/loss
- [x] Full 10-player scoreboard split by team (Blue / Red)
- [x] User's own row is highlighted with accent color and "(you)" label
- [x] Per-player stats: Champion, Role, K/D/A, CS, Gold (k), Damage (k), Vision Score
- [x] Performance breakdown cards for the current user: KDA, CS/min, Kill Participation, Damage Share, Vision Score, Gold/min
- [x] If a completed CoachingReport includes this match, AI Insight section is shown (summary, top 2 strengths, top 2 weaknesses, link to full report)
- [x] Page shows `ErrorState` if match not found or user didn't participate
- [x] Route is authenticated and user-scoped (user must have participated in the match)
- [x] TypeScript clean, build passes, tests pass

---

## Files Created

```
src/domains/match/services/matchService.ts   — getMatchDetail(): DB query + team stat computation
src/domains/match/index.ts                   — domain public API (MatchDetail, ParticipantDetail, AiInsight types)
app/api/match/[matchId]/route.ts             — GET endpoint, participant-verified, user-scoped
src/hooks/useMatchDetail.ts                  — React Query hook, 10min staleTime
app/(app)/match/[matchId]/page.tsx           — page: PerformanceCards, TeamTable ×2, AiInsightSection
```

## Files Modified

```
src/domains/analysis/components/RecentMatchList.tsx  — each row wrapped in Link → /match/[matchDbId]
```

---

## Implementation Notes

- `matchService.getMatchDetail()` computes `damageShare` and `killParticipation` per participant from live team aggregates (not stored pre-computed)
- AI Insight queries `CoachingReport` where `matchesAnalyzed` array contains the matchDbId and `status = complete`
- Route returns 404 if user's `riotAccountId` is not in any participant row — prevents arbitrary match ID exposure
- No external chart library used — inline table layout only
