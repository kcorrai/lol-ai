# TASK-109: Coach/Player Rol Farklaştırması

## Status: TODO

## Amaç
COACH ve PLAYER rolleri DB'de var ama feature farkı yok. Coach'lara özel yetkiler ekle.

## Yapılacaklar
- [ ] PLAYER üyeler team dashboard'u görebilir ama üye ekleyemez/çıkaramaz (zaten var ama UI'da belirsiz)
- [ ] COACH rolü: üye davet edebilir (şu an sadece OWNER yapabiliyor — bunu COACH'a da aç)
- [ ] Üye listesinde rol değiştirme UI (OWNER → üyenin rolünü COACH/PLAYER yapabilir)
- [ ] PATCH /api/teams/[teamId]/members/[userId] endpoint'i ekle (rol güncelleme)
- [ ] Team sayfasında "Sen Coach'sun" / "Sen Oyuncu'sun" bilgi bandı

## Etkilenen Dosyalar
- `app/api/teams/[teamId]/members/[userId]/route.ts` (yeni PATCH endpoint)
- `src/domains/teams/services/teamService.ts` (assertCoachAccess güncelle)
- `src/domains/teams/components/TeamDashboard.tsx`
- `app/(app)/teams/[teamId]/members/page.tsx`
