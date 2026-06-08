# TASK-111: Abonelik İptali — Takım Askıya Alma

## Status: TODO

## Amaç
Team plan iptal edildiğinde takımlar askıda kalmasın. Webhook bunu handle etsin.

## Yapılacaklar
- [ ] LemonSqueezy webhook: subscription_expired / subscription_cancelled event'inde plan "team" ise tüm takımları sil veya üyelikleri kaldır
- [ ] Takım sahibine e-posta bildirimi gönder (Inngest job)
- [ ] Takım üyelerine "takımınız kapatıldı" bildirimi
- [ ] Team dashboard'da askıya alınmış takım için "Plan sona erdi" banner'ı

## Etkilenen Dosyalar
- `app/api/lemonsqueezy/webhook/route.ts`
- `src/domains/teams/services/teamService.ts`
- Yeni Inngest function: `teamSuspendNotifier`
