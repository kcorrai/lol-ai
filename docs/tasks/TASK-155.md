# TASK-155: Takım AI Koçluk Raporu

## Status: Pending

## Score: 95/100

## Goal

Bireysel AI raporunun takım versiyonu. Takımın son 7 günlük maçlarını analiz edip
"ortak zayıf pozisyon", "takım sinerjisi", "en çok kayıp verilen senaryo" gibi
AI çıktısı üretir. Team Plan'ın birincil satış argümanı.

## Scope

- `src/domains/teams/services/teamReportService.ts` — takım verisini toplar, AI prompt'u oluşturur
- `app/api/teams/[teamId]/report/route.ts` — POST (üret), GET (son raporu getir)
- `src/hooks/useTeamReport.ts` — useGenerateTeamReport + useTeamReport
- `app/(team)/teams/[teamId]/report/page.tsx` — rapor sayfası
- `src/domains/teams/components/TeamReportCard.tsx` — rapor görüntüleme UI
- TeamSidebar'a "AI Raporu" nav linki ekle

## Out of Scope

- Inngest async pipeline (ilk versiyon sync, sonra ayrı task)
- Geçmiş rapor arşivi (sonraki task)
