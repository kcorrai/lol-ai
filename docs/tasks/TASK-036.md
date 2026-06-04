# TASK-036 — Analytics Widgets: Winrate Trend & Role Distribution

**Phase:** 3 — Advanced Analysis
**Status:** In Progress
**Estimated Effort:** 0.5 day

---

## Objective

Add two new analytics widgets to the dashboard Performance section that mirror
tracker.gg's high-value at-a-glance stats: a rolling win/loss trend (last 20 games as
coloured dots + 5-game window rates) and a role distribution horizontal bar chart.

---

## Acceptance Criteria

- [ ] `WinrateTrendWidget` — last 20 W/L dots (green/red), streak badge, per-5-game win rates
- [ ] `RoleDistributionWidget` — horizontal bars per role, sorted by frequency, with %
- [ ] Both added to dashboard Performance section below PerformanceTrendChart
- [ ] No new API calls — computed from `profile.recentMatches` already fetched
- [ ] Build passes, TypeScript clean
