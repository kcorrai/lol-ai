# TASK-007 — Champion Performance Stats & Analysis Service

**Phase:** 1 — MVP  
**Status:** Not Started  
**Estimated Effort:** 2 days

---

## Objective

Build the champion performance statistics aggregation service and the champion pool overview page. Users see their performance per champion across their match history.

---

## Acceptance Criteria

- [ ] `/champions` page displays a grid/table of all played champions
- [ ] Each champion shows: icon, name, games played, win rate, avg KDA, avg CS/min, avg vision score
- [ ] Champions sorted by games played (descending) by default
- [ ] Sortable by: win rate, KDA, CS/min, games played
- [ ] Win rate displayed with color coding: ≥ 55% = green, 45–55% = neutral, < 45% = red
- [ ] `champion_stats` table is populated by the analysis service
- [ ] Stats are recomputed when new matches are synced
- [ ] Stats filtered to ranked solo queue by default, toggle for other queues

---

## Technical Requirements

### Analysis Service

`src/domains/analysis/services/championStatsService.ts`:

```typescript
// Recomputes champion_stats for a riot account after sync
async function recomputeChampionStats(riotAccountId: string, queueType: string): Promise<void>
```

Logic:
1. Query all MatchParticipant records for `riot_account_id` + `queue_type`
2. Group by `champion_id`
3. Compute aggregates: wins, losses, avg KDA, avg CS/min, avg vision score, avg damage
4. Upsert into `champion_stats` table (`@@unique([riot_account_id, champion_id, queue_type])`)

This function is called by `matchSyncService` after each sync completes.

### API Endpoint

- `GET /api/analysis/champion-stats?riotAccountId=...&queueType=RANKED_SOLO_5x5`
- Returns array of champion stat objects (see `API_DESIGN.md`)

---

## Components to Build

`src/domains/analysis/components/`:
- `ChampionStatsGrid` — responsive grid of champion cards
- `ChampionStatCard` — individual champion stat block
- `WinRateBadge` — colored win rate percentage display
- `StatSortBar` — column sort controls

---

## Pages to Build

- `app/(app)/champions/page.tsx` — champion pool overview

---

## Performance Note

For a user with 100 games, champion stats computation touches ~100 MatchParticipant rows. This is fast. But do not recompute on every page load — only recompute after sync. Use `champion_stats.computed_at` to determine staleness.

---

## Dependencies

- TASK-005 (match sync must run first to have data)
- TASK-003 (champion_stats table)

---

## Notes

Champion mastery data (masteryLevel, masteryPoints) requires a separate Riot API call per champion. Skip this for MVP — only compute from match history. Add mastery as a V2 enhancement in a separate task.
