# TASK-156: Takım İstatistik Grafikleri (Win Rate Trend)

## Status: Pending

## Score: 88/100

## Goal

Takımın zaman içindeki win rate trendini gösteren line chart + her üyenin
gelişimini gösteren mini sparkline'lar. "Geçen ay %48'den %55'e çıktık"
görselliği takım motivasyonu için kritik.

## Scope

- `app/api/teams/[teamId]/stats/route.ts` — zaman dilimi bazlı istatistik endpoint
- `src/hooks/useTeamStats.ts` — useTeamStats(teamId, range)
- `src/domains/teams/components/TeamWinRateTrend.tsx` — Recharts line chart
- `src/domains/teams/components/TeamStatsPanel.tsx` — charts panel (trend + üye sparklines)
- TeamDashboard'a "İstatistikler" sekmesi olarak entegre et

## Dependencies

- recharts (zaten projede var mı kontrol et, yoksa DEPENDENCIES.md'ye ekle)

## Out of Scope

- Per-champion stats breakdown
- Export CSV
