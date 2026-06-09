# TASK-161: Paylaşılabilir Davet Linki

## Status: Pending
## Score: 75/100

## Goal
Email yerine kopyalanabilir /join/[token] linki ile davet.
Discord/WhatsApp'a paylaş, tıkla, otomatik takıma katıl.
Email davet sürtünmesini ortadan kaldırır.

## Scope
- Prisma: TeamInvite modeline `type` alanı ekle (EMAIL | LINK) + link invite'lar için email nullable
- `src/domains/teams/services/teamInviteService.ts` — generateInviteLink() ekle
- `app/api/teams/[teamId]/invite-link/route.ts` — POST (link oluştur / yenile)
- `app/join/[token]/page.tsx` — davet kabul sayfası (giriş yapmamış kullanıcılar için de çalışır)
- `src/domains/teams/components/InviteModal.tsx` — "Link ile Davet Et" sekmesi ekle

## Out of Scope
- QR kod (sonraki iterasyon)
- Linkin kaç kez kullanılabileceği limiti
