# TASK-110: Billing Sayfasına Team Seat Göstergesi

## Status: TODO

## Amaç
Team plan kullanıcısı kaç üyesi olduğunu ve kaç slot kaldığını billing sayfasında görsün.

## Yapılacaklar
- [ ] GET /api/teams/seats endpoint'i — kullanıcının tüm takımlarındaki toplam üye sayısını döndür
- [ ] Billing sayfasında team plan aktifse "Takım Üyeleri: X/5" göstergesi ekle
- [ ] Slot doluysa "Takım dolu" uyarısı
- [ ] useTeamSeats hook'u oluştur

## Etkilenen Dosyalar
- `app/api/teams/seats/route.ts` (yeni)
- `src/hooks/useTeamSeats.ts` (yeni)
- `app/(app)/settings/billing/page.tsx`
