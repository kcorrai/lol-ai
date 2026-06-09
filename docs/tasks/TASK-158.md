# TASK-158: Takım Ayarları Sayfası

## Status: Pending
## Score: 82/100

## Goal
/teams/[teamId]/settings sayfası — takım adı değiştirme, açıklama ekleme,
takım silme (OWNER only). Şu an bu sayfa tamamen eksik.

## Scope
- `app/api/teams/[teamId]/route.ts` — PATCH (güncelle) + DELETE (sil) ekle
- `src/domains/teams/services/teamService.ts` — updateTeam(), deleteTeam() ekle
- `app/(team)/teams/[teamId]/settings/page.tsx` — ayarlar sayfası
- `src/domains/teams/components/TeamSettingsForm.tsx` — isim + açıklama formu
- `src/domains/teams/components/DangerZone.tsx` — takım silme confirm diyaloğu
- TeamSidebar'a "Ayarlar" nav linki ekle (sadece OWNER görsün)

## Out of Scope
- Logo upload (Vercel Blob gerektirir, ayrı task)
- Transfer ownership
