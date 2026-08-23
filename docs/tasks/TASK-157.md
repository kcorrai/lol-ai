# TASK-157: Takım Karşılaştırma Tablosu Genişletme

## Status: Pending

## Score: 85/100

## Goal

Şu anki karşılaştırma tablosuna zaman dilimi seçici (7g / 30g / 90g) ve
pozisyon filtresi ekle. Sütun sıralama (win rate'e göre, KDA'ya göre) da ekle.

## Scope

- `app/api/teams/[teamId]/dashboard/route.ts` — `range` query param ekle (7d/30d/90d)
- `src/hooks/useTeamDashboard.ts` — range parametresini hook'a ekle
- `src/domains/teams/components/TeamComparisonTable.tsx` — mevcut tabloyu extract et,
  zaman dilimi toggle + sütun sıralama ekle
- TeamDashboard'daki mevcut tablo bileşenini yeni bileşenle değiştir

## Out of Scope

- Per-champion breakdown tablosu
- CSV export
