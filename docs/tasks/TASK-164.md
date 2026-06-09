# TASK-164: Koçluk Raporları Toplu Görünüm

## Status: Pending
## Score: 65/100

## Goal
/teams/[teamId]/reports sayfası — tüm üyelerin son koçluk raporları
tek sayfada listelenir. Koç her oyuncuya tek tek girmek yerine
overview screen'den hepsini görür ve direkt rapora gidebilir.

## Scope
- `app/api/teams/[teamId]/reports/route.ts` — her üyenin son raporunu döner
- `src/hooks/useTeamReports.ts` — useTeamReports(teamId)
- `app/(team)/teams/[teamId]/reports/page.tsx` — raporlar sayfası
- `src/domains/teams/components/TeamReportsList.tsx` — üye başına son rapor kartı
- TeamSidebar'a "Raporlar" nav linki ekle

## Out of Scope
- Rapor filtreleme (tarih, şampiyon)
- Takım geneli AI raporu (TASK-155)
