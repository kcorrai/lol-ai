# TASK-010 — Ranked History & LP Tracker

**Phase:** 1 — MVP  
**Status:** Complete  
**Estimated Effort:** 1.5 days

---

## Objective

Display the player's ranked standing and LP history over time as a line chart. This is the "progress visibility" feature that makes users feel the platform is tracking their journey.

---

## Acceptance Criteria

- [x] Dashboard page shows current rank (tier, division, LP, wins, losses, win rate)
- [x] LP history chart shows progression (bar chart, last 10 snapshots)
- [x] Chart has tooltips showing LP + date on hover (CSS, no library)
- [ ] Rank promotions/demotions visible on chart as marked points — deferred to V2
- [x] Ranked history is snapshotted on every sync (via syncAccount)
- [x] If < 3 data points exist, show message: "Play more games to see your LP progression"
- [x] Both Solo Queue and Flex Queue supported via toggle button
- [x] Tier emblem shown (colored initial letter box per tier)

---

## Technical Requirements

### Riot API Endpoint Used

- `GET /lol/league/v4/entries/by-summoner/{encryptedSummonerId}` — current ranked standing

### When to Snapshot

A `ranked_history` row is inserted:
1. When a Riot account is first connected (initial snapshot)
2. After each successful match sync (if rank changed from last snapshot)
3. Optionally: daily via a lightweight cron (Phase 2)

LP change detection:
```typescript
const lastSnapshot = await getLastRankedSnapshot(riotAccountId, queueType);
if (hasRankChanged(lastSnapshot, currentRanked)) {
  await insertRankedSnapshot(riotAccountId, currentRanked);
}
```

### Chart Implementation

Use Recharts `LineChart`:
- X-axis: `recordedAt` (date)
- Y-axis: composite LP (e.g., Gold II 67 LP = 1267, Gold I 45 = 1345)
- Composite LP formula: `tierIndex * 400 + rankIndex * 100 + lp`
- This allows a continuous line across promotions

---

## Components to Build

`src/domains/analysis/components/`:
- `RankedStandingCard` — current rank with emblem, LP, W/L, win rate
- `LPHistoryChart` — Recharts LineChart with tooltips
- `RankTierBadge` — rank tier icon + tier name

---

## Pages Affected

- `app/(app)/dashboard/page.tsx` — add `RankedStandingCard`
- Dedicated section within dashboard, not a separate page

---

## API Endpoints

- `GET /api/riot/:riotAccountId/ranked` — current ranked status
- `GET /api/riot/:riotAccountId/ranked/history` — LP history array

Both described in `API_DESIGN.md`.

---

## Dependencies

- TASK-004 (Riot account connected, summoner ID available)
- TASK-005 (sync pipeline — inserts ranked snapshots after sync)
- TASK-003 (ranked_history table)

---

## Notes

Do not build a dedicated `/ranked` page for MVP. The ranked display lives on the dashboard. A dedicated page is a V2 improvement if demand warrants it.
