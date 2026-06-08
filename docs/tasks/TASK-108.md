# TASK-108: Team Dashboard Geliştirme

## Status: TODO

## Amaç
Team dashboard'u gerçek anlamda kullanışlı hale getir. Şu an sadece üye listesi + temel rank var.

## Yapılacaklar
- [ ] Her üyenin en çok oynadığı şampiyonun ikonunu göster
- [ ] Takım genel KO ortalamasını hero'da göster
- [ ] Her üye kartında rol badge (OWNER/COACH/PLAYER)
- [ ] 7-günlük W/L trend göstergesi (↑↓)
- [ ] Boş durum tasarımı (henüz üye yok)
- [ ] getTeamDashboard'a topChampion verisi ekle

## Etkilenen Dosyalar
- `app/(app)/teams/[teamId]/page.tsx`
- `src/domains/teams/components/TeamDashboard.tsx`
- `src/domains/teams/services/teamService.ts`
- `app/api/teams/[teamId]/dashboard/route.ts`
